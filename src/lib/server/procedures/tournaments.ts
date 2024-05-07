import * as v from 'valibot';
import postgres from 'postgres';
import {
  db,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Tournament,
  TournamentDates,
  uniqueConstraints
} from '$db';
import { t } from '$trpc';
import { isDatePast, pick, trpcUnknownError } from '$lib/server/utils';
import { wrap } from '@typeschema/valibot';
import { getSession, getStaffMember } from '../helpers/trpc';
import { TRPCError } from '@trpc/server';
import { hasPermissions } from '$lib/utils';
import { eq } from 'drizzle-orm';
import {
  bwsValuesSchema,
  positiveIntSchema,
  rankRangeSchema,
  refereeSettingsSchema,
  teamSettingsSchema,
  tournamentLinkSchema,
  tournamentOtherDatesSchema,
  urlSlugSchema
} from '$lib/schemas';

function uniqueConstraintsError(err: unknown) {
  if (err instanceof postgres.PostgresError && err.code === '23505') {
    const constraint = err.message.split('"')[1];

    if (constraint === uniqueConstraints.tournament.name) {
      return "The tournament's name must be unique";
    } else if (constraint === uniqueConstraints.tournament.urlSlug) {
      return "The tournament's URL slug must be unique";
    }
  }

  return undefined;
}

const mutationSchemas = {
  name: v.string([v.minLength(2), v.maxLength(50)]),
  urlSlug: v.string([v.minLength(2), v.maxLength(16), urlSlugSchema]),
  acronym: v.string([v.minLength(2), v.maxLength(8)]),
  type: v.union([v.literal('teams'), v.literal('draft'), v.literal('solo')]),
  rankRange: v.optional(rankRangeSchema),
  teamSettings: v.optional(
    v.object({
      minTeamSize: teamSettingsSchema.entries.minTeamSize,
      maxTeamSize: teamSettingsSchema.entries.maxTeamSize
    })
  )
};

const createTournament = t.procedure
  .input(wrap(v.object(mutationSchemas)))
  .mutation(async ({ ctx, input }) => {
    const { teamSettings } = input;
    const session = getSession(ctx.cookies, true);

    if (!session.admin && !session.approvedHost) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to create a tournament'
      });
    }

    let tournament!: Pick<typeof Tournament.$inferSelect, 'urlSlug'>;

    try {
      tournament = await db.transaction(async (tx) => {
        const tournament = await tx
          .insert(Tournament)
          .values({
            ...input,
            teamSettings: teamSettings
              ? {
                  maxTeamSize: teamSettings.maxTeamSize,
                  minTeamSize: teamSettings.maxTeamSize,
                  useTeamBanners: false
                }
              : undefined
          })
          .returning(pick(Tournament, ['id', 'urlSlug']))
          .then((rows) => rows[0]);

        await tx.insert(TournamentDates).values({
          tournamentId: tournament.id
        });

        const host = await tx
          .insert(StaffMember)
          .values({
            tournamentId: tournament.id,
            userId: session.userId
          })
          .returning(pick(StaffMember, ['id']))
          .then((rows) => rows[0]);

        const [_debuggerRole, hostRole] = await tx
          .insert(StaffRole)
          .values([
            {
              name: 'Debugger',
              color: 'gray',
              permissions: ['debug'],
              order: 1,
              tournamentId: tournament.id
            },
            {
              name: 'Host',
              color: 'red',
              permissions: ['host'],
              order: 2,
              tournamentId: tournament.id
            }
          ])
          .returning(pick(StaffRole, ['id']));

        await tx.insert(StaffMemberRole).values({
          staffMemberId: host.id,
          staffRoleId: hostRole.id
        });

        return {
          urlSlug: tournament.urlSlug
        };
      });
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

      throw trpcUnknownError(err, 'Creating the tournament');
    }

    return tournament;
  });

const updateTournament = t.procedure
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        data: v.partial(
          v.object({
            tournament: v.partial(
              v.object({
                ...mutationSchemas,
                teamSettings: teamSettingsSchema,
                bwsValues: bwsValuesSchema,
                links: v.array(tournamentLinkSchema),
                refereeSettings: refereeSettingsSchema,
                rules: v.string()
              })
            ),
            dates: v.partial(
              v.object({
                publishedAt: v.date(),
                concludesAt: v.date(),
                playerRegsOpenAt: v.date(),
                playerRegsCloseAt: v.date(),
                staffRegsOpenAt: v.date(),
                staffRegsCloseAt: v.date(),
                other: v.array(tournamentOtherDatesSchema)
              })
            )
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, tournamentId } = input;
    const { tournament, dates } = data;

    if (Object.keys(tournament || {}).length === 0 && Object.keys(dates || {}).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Nothing to update'
      });
    }

    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);

    if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to update this tournament'
      });
    }

    let info:
      | (Pick<typeof Tournament.$inferSelect, 'deleted'> &
          Pick<
            typeof TournamentDates.$inferSelect,
            Exclude<keyof typeof TournamentDates.$inferSelect, 'other' | 'tournamentId'>
          >)
      | undefined;

    try {
      info = await db
        .select({
          ...pick(Tournament, ['deleted']),
          ...pick(TournamentDates, [
            'publishedAt',
            'concludesAt',
            'playerRegsCloseAt',
            'playerRegsOpenAt',
            'staffRegsCloseAt',
            'staffRegsOpenAt'
          ])
        })
        .from(Tournament)
        .where(eq(Tournament.id, tournamentId))
        .innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the tournament');
    }

    if (!info) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tournament not found'
      });
    }

    if (info.deleted) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Tournament has been deleted'
      });
    }

    const concluded = isDatePast(info.concludesAt);
    const published = isDatePast(info.publishedAt);

    if (concluded) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          "This tournament has concluded. You can't create, update or delete any data related to this tournament"
      });
    }

    if (tournament) {
      const { name, acronym, urlSlug, teamSettings, type, rankRange, bwsValues } = tournament;

      // Only the host can update these properties
      if (
        !hasPermissions(staffMember, ['host']) &&
        (name || acronym || urlSlug || teamSettings || type || rankRange || bwsValues)
      ) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            "You do not have the required permissions to update this tournament's name, acronym, URL slug, team settings (if applicable), type, rank range or BWS formula"
        });
      }

      // Only update if the tournament is not public yet
      if (published && (type || teamSettings || rankRange || bwsValues)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            "This tournament is public. You can no longer update this tournament's type, team settings (if applicable), rank range or BWS formula"
        });
      }
    }

    if (dates) {
      const {
        playerRegsCloseAt,
        playerRegsOpenAt,
        staffRegsCloseAt,
        staffRegsOpenAt,
        concludesAt,
        publishedAt
      } = dates;
      const { other: _1, ...newDates } = dates;
      const { deleted: _2, ...setDates } = info;

      if (
        !hasPermissions(staffMember, ['host']) &&
        (playerRegsCloseAt ||
          playerRegsOpenAt ||
          staffRegsCloseAt ||
          staffRegsOpenAt ||
          concludesAt ||
          publishedAt)
      ) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            "You do not have the required permissions to update this tournament's dates in which player and staff registrations open and close and when the tournament becomes public and when it concludes"
        });
      }

      const msg: Record<keyof typeof newDates, string> = {
        concludesAt: 'it concludes',
        publishedAt: 'it becomes public',
        playerRegsCloseAt: 'player registrations close',
        playerRegsOpenAt: 'player registrations open',
        staffRegsCloseAt: 'staff registrations close',
        staffRegsOpenAt: 'staff registrations open'
      };

      for (const [key_, newDate] of Object.entries(newDates)) {
        const key = key_ as keyof typeof setDates;
        const setDate = setDates[key];

        // Don't update if the date is equal or less than 1 hour into the future
        if (new Date().getTime() - newDate.getTime() >= 3_600_000) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can't update the tournament's date in which ${msg[key]} due to the inputted date being in the past, present or 1 hour into the future`
          });
        }

        if (setDate && isDatePast(setDate.getTime())) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can't update the tournament's date in which ${msg[key]} due to the currently set date being in the past`
          });
        }
      }
    }

    try {
      if (tournament) {
        await db.update(Tournament).set(tournament).where(eq(Tournament.id, tournamentId));
      }

      if (dates) {
        await db
          .update(TournamentDates)
          .set(dates)
          .where(eq(TournamentDates.tournamentId, tournamentId));
      }
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

      throw trpcUnknownError(err, 'Updating the tournament');
    }
  });

const deleteTournament = t.procedure
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId } = input;
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);

    if (!hasPermissions(staffMember, ['host'])) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to delete this tournament'
      });
    }

    try {
      await db
        .update(Tournament)
        .set({
          deleted: true
        })
        .where(eq(Tournament.id, tournamentId));
    } catch (err) {
      throw trpcUnknownError(err, 'Deleting the tournament');
    }
  });

export const tournamentsRouter = t.router({
  createTournament,
  updateTournament,
  deleteTournament
});

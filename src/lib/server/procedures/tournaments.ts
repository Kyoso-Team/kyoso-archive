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
import { hasPermissions, keys } from '$lib/utils';
import { asc, eq, ilike, or } from 'drizzle-orm';
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
    const { acronym, name, type, urlSlug, rankRange, teamSettings } = input;
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
            acronym,
            name,
            type,
            urlSlug,
            rankRange,
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
            ...mutationSchemas,
            teamSettings: teamSettingsSchema,
            bwsValues: bwsValuesSchema,
            otherDates: v.array(tournamentOtherDatesSchema),
            links: v.array(tournamentLinkSchema),
            refereeSettings: refereeSettingsSchema,
            rules: v.string()
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, tournamentId } = input;
    const { otherDates, ...tournamentData } = data;
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);

    let tournamentDates:
      | {
          publishTime: Date | null;
          concludesTime: Date | null;
        }
      | undefined;

    try {
      tournamentDates = await db
        .select({
          publishTime: TournamentDates.publishedAt,
          concludesTime: TournamentDates.concludesAt
        })
        .from(TournamentDates)
        .where(eq(TournamentDates.tournamentId, tournamentId))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the tournament');
    }

    if (!tournamentDates) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tournament not found'
      });
    }

    const concluded = isDatePast(tournamentDates.concludesTime);
    const published = isDatePast(tournamentDates.publishTime);
    const disabledAfterPublishKeys: (keyof typeof Tournament.$inferSelect)[] = [
      'bwsValues',
      'rankRange',
      'type'
    ];

    const hasDisabledKeys =
      keys(tournamentData).some((key) => disabledAfterPublishKeys.includes(key)) ||
      tournamentData.teamSettings?.maxTeamSize ||
      tournamentData.teamSettings?.minTeamSize ||
      published;

    if (published && hasDisabledKeys) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          "This tournament is public. You can no longer update the following: BWS formula, rank range, type of the tournament, the publish date. If the tournament is team based, then you also can't update the min. and max. team sizes"
      });
    }

    if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to update this tournament'
      });
    }

    if (concluded && !hasPermissions(staffMember, ['host', 'debug'])) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          "This tournament has concluded. You can't create, update or delete any data related to this tournament unless you are/were the host"
      });
    }

    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Nothing to update'
      });
    }

    try {
      await db
        .update(Tournament)
        .set({
          ...tournamentData
        })
        .where(eq(Tournament.id, tournamentId));

      if (otherDates) {
        await db
          .update(TournamentDates)
          .set({
            other: otherDates
          })
          .where(eq(TournamentDates.tournamentId, tournamentId));
      }
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

      throw trpcUnknownError(err, 'Deleting the tournament');
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

// const searchTournaments = t.procedure.input(wrap(v.string())).query(async ({ input }) => {
//   return db
//     .select()
//     .from(Tournament)
//     .where(
//       or(
//         eq(Tournament.id, +input),
//         ilike(Tournament.name, `%${input}%`),
//         ilike(Tournament.acronym, `%${input}%`),
//         ilike(Tournament.urlSlug, `%${input}%`),
//         eq(Tournament.deleted, false)
//       )
//     )
//     .orderBy(({ name }) => asc(name))
//     .limit(10);
// });
export const tournamentsRouter = t.router({
  createTournament,
  updateTournament,
  deleteTournament
  // searchTournaments
});

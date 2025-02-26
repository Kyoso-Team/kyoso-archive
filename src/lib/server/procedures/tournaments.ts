import * as v from 'valibot';
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
import { catchUniqueConstraintError$, pick, trpcUnknownError } from '$lib/server/utils';
import { wrap } from '@typeschema/valibot';
import { getSession, getStaffMember, getTournament } from '../helpers/trpc';
import { TRPCError } from '@trpc/server';
import { hasPermissions, isDatePast, sortByKey } from '$lib/utils';
import { eq, sql } from 'drizzle-orm';
import {
  bwsValuesSchema,
  modMultiplierSchema,
  positiveIntSchema,
  rankRangeSchema,
  refereeSettingsSchema,
  teamSettingsSchema,
  tournamentLinkSchema,
  tournamentOtherDatesSchema,
  urlSlugSchema
} from '$lib/schemas';
import { rateLimitMiddleware } from '$trpc/middleware';
import { TRPCChecks } from '../helpers/checks';
import {
  tournamentChecks,
  tournamentDatesChecks,
  tournamentLinksChecks,
  tournamentModMultipliersChecks,
  tournamentOtherDatesChecks
} from '$lib/helpers';

const catchUniqueConstraintError = catchUniqueConstraintError$([
  {
    name: uniqueConstraints.tournament.name,
    message: "The tournament's name must be unique"
  },
  {
    name: uniqueConstraints.tournament.urlSlug,
    message: "The tournament's URL slug must be unique"
  }
]);

const mutationSchemas = {
  name: v.string([v.minLength(2), v.maxLength(50)]),
  urlSlug: v.string([v.minLength(2), v.maxLength(16), urlSlugSchema]),
  acronym: v.string([v.minLength(2), v.maxLength(8)]),
  type: v.union([v.literal('teams'), v.literal('draft'), v.literal('solo')]),
  rankRange: v.nullish(rankRangeSchema),
  teamSettings: v.nullish(
    v.object({
      minTeamSize: teamSettingsSchema.entries.minTeamSize,
      maxTeamSize: teamSettingsSchema.entries.maxTeamSize
    })
  )
};

const createTournament = t.procedure
  .use(rateLimitMiddleware)
  .input(wrap(v.object(mutationSchemas)))
  .mutation(async ({ ctx, input }) => {
    const { teamSettings, rankRange } = input;
    const checks = new TRPCChecks({ action: 'create a tournament' });
    const session = getSession(ctx.cookies, true);
    checks.userIsApprovedHost(session);

    const checksErr = tournamentChecks({ teamSettings, rankRange });

    if (checksErr) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: checksErr
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
      const uqErr = catchUniqueConstraintError(err);
      if (uqErr) return uqErr;
      throw trpcUnknownError(err, 'Creating the tournament');
    }

    return tournament;
  });

const updateTournament = t.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        data: v.partial(
          v.object({
            ...mutationSchemas,
            rankRange: v.nullable(rankRangeSchema),
            teamSettings: v.nullable(teamSettingsSchema),
            bwsValues: v.nullable(bwsValuesSchema),
            links: v.array(tournamentLinkSchema, [v.maxLength(20)]),
            refereeSettings: refereeSettingsSchema,
            rules: v.nullable(v.string()),
            modMultipliers: v.array(modMultiplierSchema, [v.maxLength(5)])
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, tournamentId } = input;
    const {
      name,
      acronym,
      urlSlug,
      teamSettings,
      type,
      rankRange,
      bwsValues,
      links,
      modMultipliers
    } = data;
    const checks = new TRPCChecks({ action: 'update this tournament' });
    checks.partialHasValues(data);

    let checksErr = tournamentChecks({ teamSettings, rankRange });

    if (links && checksErr === undefined) {
      checksErr = tournamentLinksChecks(links);
    }

    if (modMultipliers && checksErr === undefined) {
      checksErr = tournamentModMultipliersChecks(modMultipliers);
    }

    if (checksErr) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: checksErr
      });
    }

    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

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

    const info = await getTournament(
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['publishedAt', 'concludesAt']
      },
      true
    );
    checks.tournamentNotDeleted(info).tournamentNotConcluded(info);

    // Only update if the tournament is not public yet
    if (isDatePast(info.publishedAt) && (type || teamSettings || rankRange || bwsValues)) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message:
          "This tournament is public. You can no longer update this tournament's type, team settings (if applicable), rank range or BWS formula"
      });
    }

    try {
      await db.update(Tournament).set(data).where(eq(Tournament.id, tournamentId));
    } catch (err) {
      const uqErr = catchUniqueConstraintError(err);
      if (uqErr) return uqErr;
      throw trpcUnknownError(err, 'Updating the tournament');
    }
  });

const updateTournamentDates = t.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        data: v.partial(
          v.object({
            publishedAt: v.nullable(v.date()),
            concludesAt: v.nullable(v.date()),
            playerRegsOpenAt: v.nullable(v.date()),
            playerRegsCloseAt: v.nullable(v.date()),
            staffRegsOpenAt: v.nullable(v.date()),
            staffRegsCloseAt: v.nullable(v.date()),
            other: v.array(tournamentOtherDatesSchema, [v.maxLength(20)])
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, tournamentId } = input;
    const checks = new TRPCChecks({ action: "update this tournament's dates" });
    checks.partialHasValues(data);

    const txt: Record<keyof typeof newDates, string> = {
      concludesAt: 'conclusion',
      publishedAt: 'publish',
      playerRegsCloseAt: 'player regs. closing',
      playerRegsOpenAt: 'player regs. opening',
      staffRegsCloseAt: 'staff regs. closing',
      staffRegsOpenAt: 'staff regs. opening'
    };
    const {
      playerRegsCloseAt,
      playerRegsOpenAt,
      staffRegsCloseAt,
      staffRegsOpenAt,
      concludesAt,
      publishedAt
    } = data;
    const { other: _, ...newDates } = data;
    let { other } = data;
    const now = new Date().getTime();

    if (other) {
      const checksErr = tournamentOtherDatesChecks(other);

      if (checksErr) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: checksErr
        });
      }

      other = sortByKey(other, 'fromDate', 'asc');
    }

    for (const [key_, newDate] of Object.entries(newDates)) {
      const key = key_ as keyof typeof newDates;

      if (newDate) {
        if (newDate.getTime() <= now + 3_600_000) {
          return `The tournament's ${txt[key]} date can't be set to be less than 1 hour into the future`;
        }

        if (newDate.getTime() >= now + 31_556_952_000) {
          return `The tournament's ${txt[key]} date can't be set to be greater than 1 year into the future`;
        }
      }
    }

    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

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
          "You do not have the required permissions to update this tournament's dates in which player regs. open, player regs. close, staff regs. open, staff regs. close, it becomes public or it concludes"
      });
    }

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: [
          'publishedAt',
          'concludesAt',
          'playerRegsOpenAt',
          'playerRegsCloseAt',
          'staffRegsOpenAt',
          'staffRegsCloseAt'
        ]
      },
      true
    );
    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    for (const key_ of Object.keys(newDates)) {
      const key = key_ as keyof typeof newDates;
      const setDate = tournament[key] as Date | null;

      if (setDate && isDatePast(setDate.getTime())) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `The tournament's ${txt[key]} date can't be updated due to the currently set date being in the past`
        });
      }
    }

    const checksErr = tournamentDatesChecks(
      {
        publishedAt,
        concludesAt,
        playerRegsOpenAt,
        playerRegsCloseAt,
        staffRegsOpenAt,
        staffRegsCloseAt
      },
      {
        publishedAt: publishedAt || tournament.publishedAt,
        concludesAt: concludesAt || tournament.concludesAt,
        playerRegsOpenAt: playerRegsOpenAt || tournament.playerRegsOpenAt,
        playerRegsCloseAt: playerRegsCloseAt || tournament.playerRegsCloseAt,
        staffRegsOpenAt: staffRegsOpenAt || tournament.staffRegsOpenAt,
        staffRegsCloseAt: staffRegsCloseAt || tournament.staffRegsCloseAt
      }
    );

    if (checksErr) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: checksErr
      });
    }

    try {
      await db
        .update(TournamentDates)
        .set(data)
        .where(eq(TournamentDates.tournamentId, tournamentId));
    } catch (err) {
      throw trpcUnknownError(err, "Updating the tournament's dates");
    }
  });

const deleteTournament = t.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId } = input;
    const checks = new TRPCChecks({ action: 'delete this tournament' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host']);

    const tournament = await getTournament(
      tournamentId,
      {
        dates: ['concludesAt']
      },
      true
    );
    checks.tournamentNotConcluded(tournament);

    try {
      await db
        .update(Tournament)
        .set({
          deletedAt: sql`now()`
        })
        .where(eq(Tournament.id, tournamentId));
    } catch (err) {
      throw trpcUnknownError(err, 'Deleting the tournament');
    }
  });

export const tournamentsRouter = t.router({
  createTournament,
  updateTournament,
  updateTournamentDates,
  deleteTournament
});

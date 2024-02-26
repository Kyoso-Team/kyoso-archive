import * as v from 'valibot';
import postgres from 'postgres';
import { db, StaffMember, StaffMemberRole, StaffRole, Tournament, uniqueConstraints } from '$db';
import { t } from '$trpc';
import { pick, trpcUnknownError } from '$lib/server/utils';
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
  tournamentDatesSchema,
  tournamentLinkSchema,
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
  name: v.string([v.maxLength(50)]),
  urlSlug: v.string([v.maxLength(16)]),
  acronym: v.string([v.maxLength(8), urlSlugSchema]),
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

    if (!session.admin || !session.approvedHost) {
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
            dates: tournamentDatesSchema,
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
    const {
      acronym,
      name,
      type,
      urlSlug,
      rankRange,
      teamSettings,
      bwsValues,
      dates,
      links,
      refereeSettings,
      rules
    } = data;
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId);

    if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament_settings'])) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to update this tournament'
      });
    }

    try {
      await db
        .update(Tournament)
        .set({
          acronym,
          name,
          type,
          urlSlug,
          rankRange,
          teamSettings,
          bwsValues,
          dates,
          links,
          refereeSettings,
          rules
        })
        .where(eq(Tournament.id, tournamentId));
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
    const staffMember = await getStaffMember(session, tournamentId);

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

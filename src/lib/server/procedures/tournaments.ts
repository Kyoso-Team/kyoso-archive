import * as v from 'valibot';
import postgres from 'postgres';
import {
  db,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Tournament,
  uniqueConstraints
} from '$db';
import { t } from '$trpc';
import { pick, trpcUnknownError } from '$lib/server/utils';
import { wrap } from '@typeschema/valibot';
import { positiveIntSchema, urlSlugSchema } from '$lib/schemas';
import { getSession } from '../helpers/trpc';
import { TRPCError } from '@trpc/server';

const createTournament = t.procedure
  .input(
    wrap(
      v.object({
        name: v.string([v.maxLength(50)]),
        urlSlug: v.string([v.maxLength(16)]),
        acronym: v.string([v.maxLength(8), urlSlugSchema]),
        type: v.union([v.literal('teams'), v.literal('draft'), v.literal('solo')]),
        rankRange: v.optional(
          v.object({
            lower: positiveIntSchema,
            upper: v.optional(positiveIntSchema)
          })
        ),
        teamSettings: v.optional(
          v.object({
            minTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
            maxTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)])
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const session = getSession(ctx.cookies, true);

    if (!session.admin || !session.approvedHost) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to create a tournament'
      });
    }

    const { acronym, name, type, urlSlug, rankRange, teamSettings } = input;
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
            teamSettings: teamSettings ? {
              maxTeamSize: teamSettings.maxTeamSize,
              minTeamSize: teamSettings.maxTeamSize,
              useTeamBanners: false
            } : undefined
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
      if (err instanceof postgres.PostgresError && err.code === '23505') {
        const constraint = err.message.split('"')[1];

        if (constraint === uniqueConstraints.tournament.name) {
          return "The tournament's name must be unique";
        } else if (constraint === uniqueConstraints.tournament.urlSlug) {
          return "The tournament's URL slug must be unique";
        }
      }

      throw trpcUnknownError(err, 'Creating the tournament');
    }

    return tournament;
  });

// const deleteTournament = t.procedure
//   .input(
//     wrap(
//       v.object({
//         tournamentId: positiveIntSchema
//       })
//     )
//   )
//   .mutation(async ({ ctx, input }) => {
//     const session = getSession(ctx.cookies, true);
//   });

export const tournamentsRouter = t.router({
  createTournament
});

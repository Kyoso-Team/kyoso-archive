import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { withTournamentSchema, modSchema } from '$lib/schemas';

export const validationRouter = t.router({
  isTournamentNameUnique: t.procedure.input(z.string()).query(async ({ input }) => {
    let tournament = await tryCatch(async () => {
      return await prisma.tournament.findUnique({
        where: {
          name: input
        },
        select: {
          id: true
        }
      });
    }, "Can't get tournament to validate name uniqueness.");

    return !tournament;
  }),
  isRoundNameUniqueInTournament: t.procedure
    .input(
      withTournamentSchema.extend({
        name: z.string(),
        roundId: z.number().int().optional()
      })
    )
    .query(async ({ input: { roundId, name, tournamentId } }) => {
      let round = await tryCatch(async () => {
        return await prisma.round.findUnique({
          where: {
            name_tournamentId: {
              name,
              tournamentId
            }
          },
          select: {
            id: true
          }
        });
      }, "Can't get round to validate name uniqueness.");

      return !round || (!!roundId && round.id === roundId);
    }),
  areModsUniqueInTournament: t.procedure
    .input(
      withTournamentSchema.extend({
        mods: z.array(modSchema),
        multiplierId: z.number().int().optional()
      })
    )
    .query(async ({ input: { tournamentId, mods, multiplierId } }) => {
      let multiplier = await tryCatch(async () => {
        return await prisma.modMultiplier.findUnique({
          where: {
            tournamentId_mods: {
              mods,
              tournamentId
            }
          },
          select: {
            id: true
          }
        });
      }, "Can't get mod multiplier to validate mods uniqueness.");

      return !multiplier || (!!multiplierId && multiplier.id === multiplierId);
    }),
  isStaffRoleNameUniqueInTournament: t.procedure
    .input(
      withTournamentSchema.extend({
        name: z.string(),
        staffRoleId: z.number().int().optional()
      })
    )
    .query(async ({ input: { tournamentId, name, staffRoleId } }) => {
      let staffRole = await tryCatch(async () => {
        return await prisma.staffRole.findUnique({
          where: {
            name_tournamentId: {
              name,
              tournamentId
            }
          },
          select: {
            id: true
          }
        });
      }, "Can't get staff role to validate name uniqueness.");

      return !staffRole || (!!staffRoleId && staffRole.id === staffRoleId);
    })
});

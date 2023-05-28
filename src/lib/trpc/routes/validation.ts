import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';

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
      z.object({
        name: z.string(),
        tournamentId: z.number().int(),
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

      return !round || (roundId && round.id === roundId);
    })
});

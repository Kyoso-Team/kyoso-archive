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
          name: true
        }
      });
    }, "Can't get tournament to validate name uniqueness.");

    return !tournament;
  })
});

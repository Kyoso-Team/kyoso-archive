import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournamentId } = await parent();

  let tournament = prisma.tournament.findUnique({
    where: {
      id: tournamentId
    },
    select: {
      
    }
  });

  return {
    id: tournamentId,
    ... tournament
  };
}) satisfies PageServerLoad;

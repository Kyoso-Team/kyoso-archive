import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournamentId } = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: tournamentId
    },
    select: {
      name: true,
      acronym: true,
      lowerRankRange: true,
      upperRankRange: true,
      useBWS: true
    }
  });

  return {
    id: tournamentId,
    ... tournament
  };
}) satisfies PageServerLoad;

import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
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
    id: data.tournament.id,
    ...tournament
  };
}) satisfies PageServerLoad;

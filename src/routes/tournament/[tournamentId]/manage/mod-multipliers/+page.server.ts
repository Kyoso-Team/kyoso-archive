import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      modMultipliers: true
    }
  });

  return {
    id: data.tournament.id,
    modMultipliers: tournament.modMultipliers
  };
}) satisfies PageServerLoad;

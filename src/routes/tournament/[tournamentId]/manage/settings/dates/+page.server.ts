import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournamentId } = await parent();

  let tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId
    },
    select: {
      playerRegsOpenOn: true,
      playerRegsCloseOn: true,
      staffRegsOpenOn: true,
      staffRegsCloseOn: true
    }
  });

  return {
    id: tournamentId,
    ...tournament
  };
}) satisfies PageServerLoad;

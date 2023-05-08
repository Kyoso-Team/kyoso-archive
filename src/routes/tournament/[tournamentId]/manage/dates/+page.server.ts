import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      playerRegsOpenOn: true,
      playerRegsCloseOn: true,
      staffRegsOpenOn: true,
      staffRegsCloseOn: true,
      goPublicOn: true,
      concludesOn: true
    }
  });

  return {
    id: data.tournament.id,
    ...tournament
  };
}) satisfies PageServerLoad;
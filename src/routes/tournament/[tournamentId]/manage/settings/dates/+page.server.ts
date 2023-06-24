import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();
  
  if (!hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage the dates for tournament of ID ${data.tournament.id}.`);
  }

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
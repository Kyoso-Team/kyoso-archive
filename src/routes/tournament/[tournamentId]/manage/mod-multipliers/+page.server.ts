import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage mod multipliers for tournament of ID ${data.tournament.id}.`);
  }

  let modMultipliers = await prisma.modMultiplier.findMany({
    where: {
      id: data.tournament.id
    }
  });

  return {
    modMultipliers,
    id: data.tournament.id,
  };
}) satisfies PageServerLoad;

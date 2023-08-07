import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the mod multipliers for tournament of ID ${data.tournament.id}.`
    );
  }

  let modMultipliers = await prisma.modMultiplier.findMany({
    where: {
      tournamentId: data.tournament.id
    },
    select: {
      id: true,
      mods: true,
      value: true
    }
  });

  return {
    modMultipliers,
    id: data.tournament.id,
    name: data.tournament.name,
    acronym: data.tournament.acronym
  };
}) satisfies PageServerLoad;

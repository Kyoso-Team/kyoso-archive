import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage the general settings for tournament of ID ${data.tournament.id}.`);
  }

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      name: true,
      acronym: true,
      lowerRankRange: true,
      upperRankRange: true,
      useBWS: true,
      type: true,
      useTeamBanners: true
    }
  });

  return {
    id: data.tournament.id,
    ...tournament
  };
}) satisfies PageServerLoad;

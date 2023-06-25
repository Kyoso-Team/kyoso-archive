import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage the prizes for tournament of ID ${data.tournament.id}.`);
  }

  let prizes = await prisma.prize.findMany({
    where: {
      tournamentId: data.tournament.id
    },
    select: {
      id: true,
      type: true,
      placements: true,
      trophy: true,
      medal: true,
      badge: true,
      banner: true,
      items: true,
      osuSupporter: true,
      cash: {
        select: {
          currency: true,
          metric: true,
          value: true
        }
      }
    },
    orderBy: {
      placements: 'asc'
    }
  });

  return {
    prizes,
    id: data.tournament.id,
    services: data.tournament.services
  };
}) satisfies PageServerLoad;

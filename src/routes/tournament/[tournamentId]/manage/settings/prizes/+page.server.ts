import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage the prizes for tournament of ID ${data.tournament.id}.`);
  }

  let prizes = await prisma.prize.findMany({
    where: {
      id: data.tournament.id
    },
    select: {
      id: true,
      type: true,
      positions: true,
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
      },
      awardedToPlayers: {
        select: {
          user: {
            select: {
              id: true,
              osuUsername: true
            }
          }
        }
      },
      awardedToTeams: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return {
    prizes,
    id: data.tournament.id
  };
}) satisfies PageServerLoad;

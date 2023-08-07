import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the stages for tournament of ID ${data.tournament.id}.`
    );
  }

  let stages = await prisma.stage.findMany({
    where: {
      tournamentId: data.tournament.id
    },
    select: {
      id: true,
      format: true,
      isMainStage: true,
      order: true,
      rounds: {
        select: {
          id: true,
          name: true,
          order: true,
          standardRound: {
            select: {
              bestOf: true,
              banCount: true
            }
          },
          battleRoyaleRound: {
            select: {
              playersEliminatedPerMap: true
            }
          },
          qualifierRound: {
            select: {
              runCount: true,
              summarizeRunsAs: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      order: 'asc'
    }
  });

  return {
    stages,
    id: data.tournament.id,
    name: data.tournament.name,
    acronym: data.tournament.acronym
  };
}) satisfies PageServerLoad;

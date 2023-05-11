import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let { stages } = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      stages: {
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
      }
    }
  });

  return {
    id: data.tournament.id,
    stages
  };
}) satisfies PageServerLoad;
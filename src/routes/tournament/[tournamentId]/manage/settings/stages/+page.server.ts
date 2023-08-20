import db from '$db';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the stages for tournament of ID ${data.tournament.id}.`
    );
  }

  let stages = await db.query.dbStage.findMany({
    columns: {
      id: true,
      format: true,
      isMainStage: true,
      order: true
    },
    with: {
      rounds: {
        columns: {
          id: true,
          name: true,
          order: true
        },
        with: {
          standardRound: {
            columns: {
              bestOf: true,
              banCount: true
            }
          },
          qualifierRound: {
            columns: {
              runCount: true,
              summarizeRunsAs: true
            }
          },
          battleRoyaleRound: {
            columns: {
              playersEliminatedPerMap: true
            }
          }
        },
        orderBy: (round, { asc }) => asc(round.order)
      }
    },
    where: (stage, { eq }) => eq(stage.tournamentId, data.tournament.id),
    orderBy: (stage, { asc }) => asc(stage.order)
  });;

  return {
    stages,
    id: data.tournament.id,
    name: data.tournament.name,
    acronym: data.tournament.acronym
  };
}) satisfies PageServerLoad;

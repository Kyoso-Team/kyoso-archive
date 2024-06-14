import { error } from '@sveltejs/kit';
import { getStaffMember, getTournament } from '$lib/server/helpers/api';
import { isDatePast } from '$lib/server/utils';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ route, params, parent }) => {
  const { session, isDevEnv, isUserOwner } = await parent();

  if (!session) {
    throw error(401, 'You must be logged in');
  }

  const tournament = await getTournament(
    params.tournament_slug,
    {
      tournament: ['id', 'acronym', 'deletedAt'],
      dates: ['concludesAt']
    },
    route,
    true
  );

  if (tournament.deletedAt && isDatePast(tournament.deletedAt)) {
    throw error(403, 'Tournament has been deleted');
  }

  const staffMember = await getStaffMember(session, tournament.id, route, true);

  return {
    session,
    isDevEnv,
    isUserOwner,
    staffMember,
    tournament: {
      id: tournament.id,
      acronym: tournament.acronym,
      concludesAt: tournament.concludesAt,
      urlSlug: params.tournament_slug
    }
  };
}) satisfies LayoutServerLoad;

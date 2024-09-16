import { error } from '@sveltejs/kit';
import { getStaffMember, getTournament } from '$lib/server/context';
import { isDatePast } from '$lib/server/utils';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ params, parent }) => {
  const { session, isUserOwner } = await parent();

  if (!session) {
    throw error(401, 'You must be logged in');
  }

  const tournament = await getTournament(
    'layout',
    params.tournament_slug,
    {
      tournament: ['id', 'acronym', 'deletedAt'],
      dates: ['concludesAt']
    },
    true
  );

  if (tournament.deletedAt && isDatePast(tournament.deletedAt)) {
    throw error(403, 'Tournament has been deleted');
  }

  const staffMember = await getStaffMember('layout', session, tournament.id, true);

  return {
    session,
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

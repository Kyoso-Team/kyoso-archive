import { error } from '@sveltejs/kit';
import { getSession, getStaffMember, getTournament } from '$lib/server/helpers/api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies, route, params }) => {
  const session = getSession(cookies, true);

  const tournament = await getTournament(params.tournament_slug, {
    tournament: ['id', 'acronym', 'deleted'],
    dates: ['concludesAt']
  }, route, true);

  if (tournament.deleted) {
    throw error(403, 'Tournament has been deleted');
  }

  const staffMember = await getStaffMember(session, tournament.id, route, true);

  return {
    session,
    staffMember,
    tournament: {
      id: tournament.id,
      acronym: tournament.acronym,
      concludesAt: tournament.concludesAt,
      urlSlug: params.tournament_slug
    }
  };
}) satisfies LayoutServerLoad;

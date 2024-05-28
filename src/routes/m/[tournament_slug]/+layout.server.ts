import { error } from '@sveltejs/kit';
import { getSession, getStaffMember } from '$lib/server/helpers/api';
import { db, Tournament, TournamentDates } from '$db';
import { apiError, isDatePast, pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies, route, params }) => {
  const session = getSession(cookies, true);

  let tournament:
    | (Pick<typeof Tournament.$inferSelect, 'id' | 'acronym' | 'deletedAt'> &
        Pick<typeof TournamentDates.$inferSelect, 'concludesAt'>)
    | undefined;

  try {
    tournament = await db
      .select({
        ...pick(Tournament, ['id', 'acronym', 'deletedAt']),
        ...pick(TournamentDates, ['concludesAt'])
      })
      .from(Tournament)
      .where(eq(Tournament.urlSlug, params.tournament_slug))
      .leftJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
      .limit(1)
      .then((tournaments) => tournaments[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the tournament', route);
  }

  if (!tournament) {
    throw error(404, 'Tournament not found');
  }

  if (tournament.deletedAt && isDatePast(tournament.deletedAt)) {
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

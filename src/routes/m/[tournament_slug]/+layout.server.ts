import { error } from '@sveltejs/kit';
import { getSession, getStaffMember } from '$lib/server/helpers/api';
import { db, Tournament, TournamentDates } from '$db';
import { apiError, pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies, route, params }) => {
  const session = getSession(cookies, true);

  let tournament:
    | (Pick<typeof Tournament.$inferSelect, 'id' | 'acronym' | 'deleted'> & {
        concludesTime: Date | null;
      })
    | undefined;

  try {
    tournament = await db
      .select({
        ...pick(Tournament, ['id', 'acronym', 'deleted']),
        concludesTime: TournamentDates.concludesAt
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

  if (tournament.deleted) {
    throw error(403, 'This tournament has been deleted');
  }

  const staffMember = await getStaffMember(session, tournament.id, route, true);

  return {
    session,
    staffMember,
    tournament: {
      id: tournament.id,
      acronym: tournament.acronym,
      concludestime: tournament.concludesTime,
      urlSlug: params.tournament_slug
    }
  };
}) satisfies LayoutServerLoad;

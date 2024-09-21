import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { StaffMember, Tournament, TournamentDates } from '$db';
import { getSession } from '$lib/server/context';
import { db } from '$lib/server/services';
import { future } from '$lib/server/sql';
import { pick } from '$lib/server/utils';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession('page', cookies, true);

  const tournaments = await db
    .select({
      ...pick(Tournament, ['id', 'urlSlug', 'name', 'bannerMetadata']),
      staffs: sql<boolean>`${StaffMember.userId} = ${session.userId}`.as('staffs'),
      // TODO: Replace with an actual condition when we have a player table
      plays: sql<boolean>`false`.as('plays')
    })
    .from(Tournament)
    .where(
      // and(
      //   or(eq(dbStaffMember.userId, session.id), eq(dbPlayer.userId, session.id)),
      //   or(gt(dbTournament.concludesOn, new Date()), isNull(dbTournament.concludesOn))
      // )
      and(
        eq(StaffMember.userId, session.userId),
        or(isNull(Tournament.deletedAt), future(Tournament.deletedAt)),
        or(isNull(TournamentDates.concludesAt), future(TournamentDates.concludesAt))
      )
    )
    .leftJoin(StaffMember, eq(StaffMember.tournamentId, Tournament.id))
    .leftJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id));
  //.leftJoin(dbPlayer, eq(dbPlayer.tournamentId, dbTournament.id));

  const tournamentsPlaying: Pick<
    typeof Tournament.$inferSelect,
    'id' | 'urlSlug' | 'name' | 'bannerMetadata'
  >[] = [];
  const tournamentsStaffing: typeof tournamentsPlaying = [];

  tournaments.forEach((tournament) => {
    const { staffs, plays, ...rest } = tournament;

    if (staffs) {
      tournamentsStaffing.push(rest);
    }

    if (plays) {
      tournamentsPlaying.push(rest);
    }
  });

  return {
    session,
    tournamentsPlaying,
    tournamentsStaffing
  };
}) satisfies PageServerLoad;

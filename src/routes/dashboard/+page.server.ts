import { db, StaffMember, Tournament, TournamentDates } from '$db';
import { and, eq, or, sql, gt, isNull, not } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import { getSession } from '$lib/server/helpers/api';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies, true);

  const _tournaments = await db
    .select({
      ...pick(Tournament, ['id', 'name', 'bannerMetadata']),
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
        not(Tournament.deleted),
        or(gt(TournamentDates.concludesAt, sql`now()`), isNull(TournamentDates.concludesAt))
      )
    )
    .leftJoin(StaffMember, eq(StaffMember.tournamentId, Tournament.id))
    .leftJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id));
  //.leftJoin(dbPlayer, eq(dbPlayer.tournamentId, dbTournament.id));

  const tournamentsPlaying: Pick<
    typeof Tournament.$inferSelect,
    'id' | 'name' | 'bannerMetadata'
  >[] = [];
  const tournamentsStaffing: typeof tournamentsPlaying = [];

  // tournaments.forEach((tournament) => {
  //   const data = {
  //     id: tournament.id,
  //     name: tournament.name,
  //     bannerMetadata: tournament.bannerMetadata
  //   };

  //   if (tournament.staffs) {
  //     tournamentsStaffing.push(data);
  //   }

  //   if (tournament.plays) {
  //     tournamentsPlaying.push(data);
  //   }
  // });

  return {
    session,
    tournamentsPlaying,
    tournamentsStaffing
  };
}) satisfies PageServerLoad;

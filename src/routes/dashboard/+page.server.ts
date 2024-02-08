// import db from '$db';
// import { dbTournament, dbUser, dbPlayer, dbStaffMember } from '$db/schema';
// import { and, eq, or, sql, gt, isNull } from 'drizzle-orm';
// import { getSession, findFirstOrThrow, pick } from '$lib/server-utils';
// import type { PageServerLoad } from './$types';

// export const load = (async (event) => {
//   let storedUser = getSession(event, true);

//   let user = findFirstOrThrow(
//     await db
//       .select({
//         freeServicesLeft: dbUser.freeServicesLeft
//       })
//       .from(dbUser)
//       .where(eq(dbUser.id, storedUser.id)),
//     'user'
//   );

//   let tournaments = await db
//     .select({
//       ...pick(dbTournament, ['id', 'name', 'hasBanner']),
//       as: sql<'staff' | 'player' | 'staff & player'>`case
//         when ${dbStaffMember.userId} = ${storedUser.id} and ${dbPlayer.userId} = ${storedUser.id}
//           then 'staff & player'
//         when ${dbStaffMember.userId} = ${storedUser.id}
//           then 'staff'
//         else 'player'
//       end`
//     })
//     .from(dbTournament)
//     .where(
//       and(
//         or(eq(dbStaffMember.userId, storedUser.id), eq(dbPlayer.userId, storedUser.id)),
//         or(gt(dbTournament.concludesOn, new Date()), isNull(dbTournament.concludesOn))
//       )
//     )
//     .leftJoin(dbStaffMember, eq(dbStaffMember.tournamentId, dbTournament.id))
//     .leftJoin(dbPlayer, eq(dbPlayer.tournamentId, dbTournament.id));

//   let tournamentsPlaying: Omit<(typeof tournaments)[number], 'as'>[] = [];
//   let tournamentsStaffing: typeof tournamentsPlaying = [];

//   tournaments.forEach((tournament) => {
//     let data = {
//       id: tournament.id,
//       name: tournament.name,
//       hasBanner: tournament.hasBanner
//     };

//     if (tournament.as.includes('staff')) {
//       tournamentsStaffing.push(data);
//     }

//     if (tournament.as.includes('player')) {
//       tournamentsPlaying.push(data);
//     }
//   });

//   return {
//     user,
//     tournamentsPlaying,
//     tournamentsStaffing
//   };
// }) satisfies PageServerLoad;

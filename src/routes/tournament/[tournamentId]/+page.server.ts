// import db from '$db';
// import {
//   dbTournament,
//   dbPlayer,
//   dbTeam,
//   dbPrize,
//   dbPrizeCash,
//   dbCountry,
//   dbStaffMember,
//   dbStaffMemberToStaffRole,
//   dbStaffRole,
//   dbUser
// } from '$db/schema';
// import { eq, sql, desc, asc } from 'drizzle-orm';
// import { findFirstOrThrow, pick } from '$lib/server/utils';
// import type { PageServerLoad } from './$types';

// export const load = (async (event) => {
//   let data = await event.parent();

//   let tournamentQuery = db
//     .select({
//       general: pick(dbTournament, [
//         'id',
//         'name',
//         'acronym',
//         'hasBanner',
//         'hasLogo',
//         'lowerRankRange',
//         'upperRankRange',
//         'type',
//         'teamSize',
//         'teamPlaySize',
//         'useBWS'
//       ]),
//       dates: pick(dbTournament, [
//         'playerRegsOpenOn',
//         'playerRegsCloseOn',
//         'staffRegsOpenOn',
//         'staffRegsCloseOn',
//         'concludesOn'
//       ]),
//       links: pick(dbTournament, [
//         'forumPostId',
//         'discordInviteId',
//         'mainSheetId',
//         'twitchChannelName',
//         'youtubeChannelId',
//         'twitterHandle',
//         'donationLink',
//         'websiteLink'
//       ])
//     })
//     .from(dbTournament)
//     .where(eq(dbTournament.id, sql.placeholder('tournamentId')))
//     .prepare('tournament');

//   let playerCountQuery = db
//     .select({
//       players: sql`count(*)::bigint`.mapWith(Number)
//     })
//     .from(dbPlayer)
//     .where(eq(dbPlayer.tournamentId, dbTournament.id));

//   let teamCountQuery = db
//     .select({
//       teams: sql`count(*)::bigint`.mapWith(Number)
//     })
//     .from(dbTeam)
//     .where(eq(dbTeam.tournamentId, dbTournament.id));

//   let countsQuery = db
//     .select({
//       players: sql`(${playerCountQuery}) as "players"`,
//       teams: sql`(
//         case
//           when not ${dbTournament.type} = 'solo'
//             then (${teamCountQuery})
//           else 0
//         end
//       ) as "teams"`
//     })
//     .from(dbTournament)
//     .where(eq(dbTournament.id, sql.placeholder('tournamentId')))
//     .prepare('counts');

//   let prizesQuery = db
//     .select({
//       ...pick(dbPrize, [
//         'type',
//         'placements',
//         'trophy',
//         'medal',
//         'badge',
//         'banner',
//         'additionalItems',
//         'monthsOsuSupporter'
//       ]),
//       cash: pick(dbPrizeCash, ['value', 'metric', 'currency'])
//     })
//     .from(dbPrize)
//     .where(eq(dbPrize.tournamentId, sql.placeholder('tournamentId')))
//     .leftJoin(dbPrizeCash, eq(dbPrizeCash.inPrizeId, dbPrize.id))
//     .orderBy(desc(dbPrize.type)) // Type "tournament" will appear before prizes of type "pickems"
//     .orderBy(desc(dbPrize.placements))
//     .prepare('prizes');

//   let stagesQuery = db.query.dbStage
//     .findMany({
//       columns: {
//         id: true,
//         format: true,
//         isMainStage: true
//       },
//       with: {
//         rounds: {
//           columns: {
//             name: true,
//             targetStarRating: true,
//             // The below fields are to determine if stats, schedules and/or mappool from a round should be linked to
//             mappoolState: true,
//             publishSchedules: true,
//             publishStats: true
//           },
//           with: {
//             standardRound: {
//               columns: {
//                 bestOf: true,
//                 banCount: true,
//                 protectCount: true
//               }
//             },
//             qualifierRound: {
//               columns: {
//                 runCount: true,
//                 summarizeRunsAs: true
//               }
//             },
//             battleRoyaleRound: {
//               columns: {
//                 playersEliminatedPerMap: true
//               }
//             },
//             modpools: {
//               columns: {
//                 category: true,
//                 mapCount: true
//               }
//             }
//           },
//           orderBy: (round) => asc(round.order)
//         }
//       },
//       where: (stage) => eq(stage.tournamentId, sql.placeholder('tournamentId')),
//       orderBy: (stage) => asc(stage.order)
//     })
//     .prepare('stages');

//   let staffMembersQuery = db
//     .select({
//       role: pick(dbStaffRole, ['name', 'color']),
//       user: pick(dbUser, ['id', 'osuUserId', 'osuUsername']),
//       country: pick(dbCountry, ['name', 'code'])
//     })
//     .from(dbStaffMemberToStaffRole)
//     .where(eq(dbStaffMember.tournamentId, sql.placeholder('tournamentId')))
//     .innerJoin(dbStaffMember, eq(dbStaffMember.id, dbStaffMemberToStaffRole.staffMemberId))
//     .innerJoin(dbStaffRole, eq(dbStaffRole.id, dbStaffMemberToStaffRole.staffRoleId))
//     .innerJoin(dbUser, eq(dbUser.id, dbStaffMember.userId))
//     .innerJoin(dbCountry, eq(dbCountry.id, dbUser.countryId))
//     .prepare('staffMembers');

//   let placeholderValues = {
//     tournamentId: data.tournament.id
//   };
//   let tournament = findFirstOrThrow(await tournamentQuery.execute(placeholderValues), 'tournament');

//   return {
//     general: tournament.general,
//     dates: tournament.dates,
//     links: tournament.links,
//     streamed: {
//       counts: countsQuery.execute(placeholderValues),
//       prizes: prizesQuery.execute(placeholderValues),
//       stages: stagesQuery.execute(placeholderValues),
//       staffMembers: staffMembersQuery.execute(placeholderValues)
//     }
//   };
// }) satisfies PageServerLoad;

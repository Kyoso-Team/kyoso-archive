import {
  dbModMultiplier,
  dbStaffMember,
  dbStaffMemberToStaffRole,
  dbStaffRole,
  dbTournament
} from '../../src/db/schema';
import { r } from './utils';
import { createSpinner } from 'nanospinner';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Client as OsuClient } from 'osu-web.js';

// Seriously needs a rework...
export async function seedTeamTournament(
  db: PostgresJsDatabase,
  osuClient: OsuClient,
  discordBotToken: string,
  userCount: number
) {
  let spinner = createSpinner('Seed team tournament').start();
  let isOpenRank = r.boolean();

  let tournament = await db
    .insert(dbTournament)
    .values({
      name: 'Test Team Tournament',
      acronym: 'TTT',
      useBWS: r.boolean(),
      services: ['registrations', 'referee', 'stats', 'pickems'],
      lowerRankRange: isOpenRank ? -1 : 1,
      upperRankRange: isOpenRank ? -1 : 10000,
      type: 'teams',
      teamSize: 3,
      teamPlaySize: 2
    })
    .returning({
      id: dbTournament.id
    });

  let host = await db
    .insert(dbStaffMember)
    .values({
      userId: r.number(1, userCount),
      tournamentId: tournament[0].id
    })
    .returning({
      id: dbStaffMember.id,
      userId: dbStaffMember.userId
    });

  let usedUserIds = [host[0].userId];
  let staffMemberIds: number[] = [];

  for (let i = 0; i < 5; i++) {
    let userId = r.number(1, userCount, usedUserIds);
    usedUserIds.push(userId);

    let staffMember = await db
      .insert(dbStaffMember)
      .values({
        userId,
        tournamentId: tournament[0].id
      })
      .returning({
        id: dbStaffMember.id
      });

    staffMemberIds.push(staffMember[0].id);
  }

  let [_debuggerRole, hostRole, refereeRole] = await db
    .insert(dbStaffRole)
    .values([
      {
        name: 'Debugger',
        color: 'gray',
        permissions: ['debug'],
        order: 0,
        tournamentId: tournament[0].id
      },
      {
        name: 'Host',
        color: 'red',
        permissions: ['host'],
        order: 1,
        tournamentId: tournament[0].id
      },
      {
        name: 'Referee',
        color: 'emerald',
        permissions: ['ref_matches'],
        order: 2,
        tournamentId: tournament[0].id
      }
    ])
    .returning({
      id: dbStaffRole.id
    });

  await db.insert(dbStaffMemberToStaffRole).values([
    {
      staffMemberId: host[0].id,
      staffRoleId: hostRole.id
    },
    ...staffMemberIds.map((staffMemberId) => ({
      staffMemberId,
      staffRoleId: refereeRole.id
    }))
  ]);

  await db.insert(dbModMultiplier).values({
    value: 2.2,
    mods: ['ez'],
    tournamentId: tournament[0].id
  });

  spinner.success();

  // Scuffed code is temp
  // let playerIds: number[] = [];
  // let playerRanks: number[] = [];
  // let playerBwsRanks: number[] = [];
  // let randomAvailabilities = [
  //   '001101110000110111000000.001101110000110111000000.001101110000110111000000.001101110000110111000000',
  //   '101010100101010100010010.010101001010100101010100.010101001010100101000100.010101001010101001001010',
  //   '000011100101101010101001.000111110011001011101110.100100000111000001000010.100010000100011001101001'
  // ];

  // Needs rework
  // for (let i = 0; i < 12; i++) {
  //   let userId = r.number(1, userCount, usedUserIds);
  //   usedUserIds.push(userId);

  //   let badgeCount = r.number(1, 5);
  //   let rank = r.number(1, 150_000);
  //   let bwsRank = Math.round(rank ** (0.9937 ** (badgeCount ** 2)));

  //   let player = await db
  //     .insert(dbPlayer)
  //     .values({
  //       userId,
  //       badgeCount,
  //       rank,
  //       bwsRank,
  //       availability: r.array(randomAvailabilities, 1)[0],
  //       tournamentId: tournament[0].id
  //     })
  //     .returning({
  //       id: dbPlayer.id
  //     });

  //   playerIds.push(player[0].id);
  //   playerRanks.push(rank);
  //   playerBwsRanks.push(bwsRank);
  // }

  // // Todo: Create 2 teams of 2 and 2 teams of 3. Only creating 1 team for now
  // let team1PlayerRanks = [playerRanks[0], playerRanks[1], playerRanks[2]];
  // let team1PlayerBwsRanks = [playerBwsRanks[0], playerBwsRanks[1], playerBwsRanks[2]];

  // let team = await db
  //   .insert(dbTeam)
  //   .values({
  //     inviteId: r.string(8),
  //     name: r.string(5, 20),
  //     tournamentId: tournament[0].id,
  //     captainId: playerIds[0],
  //     avgRank: team1PlayerRanks.reduce((total, rank) => total + rank, 0) / team1PlayerRanks.length,
  //     avgBwsRank:
  //       team1PlayerBwsRanks.reduce((total, rank) => total + rank, 0) / team1PlayerBwsRanks.length
  //   })
  //   .returning({
  //     id: dbTeam.id
  //   });

  // await db
  //   .update(dbPlayer)
  //   .set({
  //     teamId: team[0].id
  //   })
  //   .where(inArray(dbPlayer.id, [playerIds[0], playerIds[1], playerIds[2]]));
}

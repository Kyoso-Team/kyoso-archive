import fetch from 'node-fetch';
import postgres from 'postgres';
import {
  dbCountry,
  dbModMultiplier,
  dbPlayer,
  dbStaffMember,
  dbStaffMemberToStaffRole,
  dbStaffRole,
  dbTeam,
  dbTournament,
  dbUser
} from '../src/lib/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Client as OsuClient, Auth as OsuAuth } from 'osu-web.js';
import { config } from 'dotenv';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import type { User as DiscordUser } from 'discord-oauth2';

config();

let env = z
  .object({
    osuClientId: z.number(),
    osuClientSecret: z.string(),
    osuRedirectUri: z.string(),
    discordBotToken: z.string(),
    databaseUrl: z.string()
  })
  .parse({
    osuClientId: Number(process.env.PUBLIC_OSU_CLIENT_ID),
    osuClientSecret: process.env.OSU_CLIENT_SECRET,
    osuRedirectUri: process.env.PUBLIC_OSU_REDIRECT_URI,
    discordBotToken: process.env.DISCORD_BOT_TOKEN,
    databaseUrl: process.env.DATABASE_URL
  });

const pg = postgres(env.databaseUrl, { max: 1 });
const db = drizzle(pg);

const osuAuth = new OsuAuth(env.osuClientId, env.osuClientSecret, env.osuRedirectUri);
const osuToken = await osuAuth.clientCredentialsGrant();
const osuClient = new OsuClient(osuToken.access_token);

const userCount = 50;

/**
 * Randomize values
 */
const r = {
  boolean: () => {
    return Math.random() < 0.5;
  },
  string: (min: number, max: number = min) => {
    let length = r.number(min, max);
    return [...Array(length)].map(() => (Math.random() || 0.69).toString(36)[2]).join('');
  },
  number: (min: number, max: number = min, exclude: number[] = []): number => {
    let result = Math.floor(Math.random() * (max + 1 - min) + min);
    return exclude.find((value) => value === result) ? r.number(min, max, exclude) : result;
  },
  array: <T>(arr: T[], amount?: number) => {
    let x = arr.length;
    for (let i = 0; amount ? arr.length === amount : i < x; i++) {
      if (r.boolean() && arr.length > 1) {
        arr.splice(r.number(0, arr.length - 1), 1);
      }
    }
    return arr;
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedUsers() {
  function id(osu: number, discord: string) {
    return { osu, discord };
  }

  // Feel free to add more users
  // If you do so, change the userCount constant to match the amount of users below
  // A 2D array consisting of 10 IDs per array is made to avoid making too many calls to the osu! and Discord API
  let ids = [
    [
      id(8203119, '443192613621858304'),
      id(9676089, '321933284114300928'),
      id(6231292, '308083236071014402'),
      id(12058601, '194198021829951489'),
      id(1797189, '125419051290853376')
    ],
    [
      id(15173398, '336333475814703104'),
      id(14112951, '331031326688018432'),
      id(7279762, '196497984580616193'),
      id(10000899, '250693235091963904'),
      id(2756335, '369469339083997185')
    ],
    [
      id(1576095, '823764250304446504'),
      id(9918921, '296804750295302145'),
      id(808976, '425247127346741250'),
      id(13352562, '842179503408414781'),
      id(14271017, '201007982060765184')
    ],
    [
      id(8599070, '126806732889522176'),
      id(3958619, '185648818111512576'),
      id(20971891, '452410682214842368'),
      id(12455868, '345003515594276865'),
      id(7892873, '203153128940371968')
    ],
    [
      id(17980099, '244886511370240001'),
      id(21728944, '248893859126312960'),
      id(14356517, '621923547798962177'),
      id(9433144, '177799252951564288'),
      id(15229290, '587825148267331594')
    ],
    [
      id(3372322, '121310011778531331'),
      id(18618027, '311157082973798400'),
      id(1013605, '556857604060479489'),
      id(8240995, '142725947760574464'),
      id(13968504, '671166695116898314')
    ],
    [
      id(6968364, '134285412498669568'),
      id(25512851, '606853872413048852'),
      id(16834515, '544302017376550923'),
      id(18365259, '846755445745123338'),
      id(15899307, '381439606010150913')
    ],
    [
      id(7671790, '150313781673721856'),
      id(9188548, '108904078351814656'),
      id(16060432, '345670350773813250'),
      id(1997719, '121440769331560459'),
      id(18315188, '133345027660316673')
    ],
    [
      id(12835025, '332601750169321483'),
      id(9808432, '238751195345190913'),
      id(16052525, '197089152074907648'),
      id(8406711, '274919681809186817'),
      id(11364009, '330540904349696000')
    ],
    [
      id(3191010, '258709654366978049'),
      id(17100083, '351147827289653249'),
      id(12754827, '346046056703721482'),
      id(9501251, '140893290647126017'),
      id(13684009, '183552082681266176')
    ]
  ];

  for (let i = 0; i < ids.length; i++) {
    await Promise.all(
      ids[i].map(async (id) => {
        let osu = await osuClient.users.getUser(id.osu, {
          query: {
            key: 'id'
          },
          urlParams: {
            mode: 'osu'
          }
        });

        let discordResp = await fetch(`https://discord.com/api/users/${id.discord}`, {
          headers: {
            Authorization: `Bot ${env.discordBotToken}`
          }
        });
        let discord = (await discordResp.json()) as DiscordUser;

        let country = await db
          .insert(dbCountry)
          .values({
            code: osu.country.code,
            name: osu.country.name
          })
          .onConflictDoNothing({
            target: dbCountry.code
          })
          .returning({
            id: dbCountry.id
          });

        if (country[0] === undefined) {
          country = await db
            .select({
              id: dbCountry.id
            })
            .from(dbCountry)
            .where(eq(dbCountry.code, osu.country.code));
        }

        await db.insert(dbUser).values({
          apiKey: r.string(24),
          discordAccesstoken: r.string(64),
          discordRefreshToken: r.string(64),
          osuAccessToken: r.string(64),
          osuRefreshToken: r.string(64),
          isAdmin: r.boolean(),
          isRestricted: r.boolean(),
          osuUserId: osu.id,
          osuUsername: osu.username,
          rank: osu.statistics.global_rank,
          discordUserId: discord.id,
          discordUsername: discord.username,
          discordDiscriminator: discord.discriminator,
          countryId: country[0].id
        });
      })
    );

    await sleep(1000);
  }

  return 'Seeded users';
}

async function seedteamTournament() {
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

  // Scuffed code is temp
  let playerIds: number[] = [];
  let playerRanks: number[] = [];
  let playerBwsRanks: number[] = [];
  let randomAvailabilities = [
    '001101110000110111000000.001101110000110111000000.001101110000110111000000.001101110000110111000000',
    '101010100101010100010010.010101001010100101010100.010101001010100101000100.010101001010101001001010',
    '000011100101101010101001.000111110011001011101110.100100000111000001000010.100010000100011001101001'
  ];

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

  return 'Seeded team tournament';
}

async function main() {
  console.log('Seeding database...');

  console.log(await seedUsers());
  console.log(await seedteamTournament());
}

main().then(() => process.exit(0));

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { Client as OsuClient, Auth as OsuAuth } from 'osu-web.js';
import { config } from 'dotenv';
import { z } from 'zod';
import type { User as DiscordUser } from 'discord-oauth2';

config();

let env = z
  .object({
    osuClientId: z.number(),
    osuClientSecret: z.string(),
    osuRedirectUri: z.string(),
    discordBotToken: z.string()
  })
  .parse({
    osuClientId: Number(process.env.PUBLIC_OSU_CLIENT_ID),
    osuClientSecret: process.env.OSU_CLIENT_SECRET,
    osuRedirectUri: process.env.PUBLIC_OSU_REDIRECT_URI,
    discordBotToken: process.env.DISCORD_BOT_TOKEN
  });

const prisma = new PrismaClient();

const osuAuth = new OsuAuth(env.osuClientId, env.osuClientSecret, env.osuRedirectUri);
const osuToken = await osuAuth.clientCredentialsGrant();
const osuClient = new OsuClient(osuToken.access_token);

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
  number: (min: number, max: number = min) => {
    return Math.floor(Math.random() * (max + 1 - min) + min);
  },
  array: (arr: any[], amount?: number) => {
    let x = arr.length;
    for (let i = 0; amount ? arr.length === amount : i < x; i++) {
      if (r.boolean() && arr.length > 1) {
        arr.splice(r.number(0, arr.length - 1), 1);
      }
    }
    return arr;
  }
};

async function seedUsers(): Promise<'done'> {
  function id(osu: number, discord: string) {
    return { osu, discord };
  }

  let ids = [
    id(8203119, '443192613621858304'),
    id(9676089, '321933284114300928'),
    id(6231292, '308083236071014402'),
    id(12058601, '194198021829951489'),
    id(1797189, '125419051290853376'),
    id(15173398, '336333475814703104'),
    id(14112951, '331031326688018432'),
    id(7279762, '196497984580616193'),
    id(10000899, '250693235091963904'),
    id(2756335, '369469339083997185'),
    id(1576095, '823764250304446504'),
    id(9918921, '296804750295302145'),
    id(808976, '425247127346741250'),
    id(13352562, '842179503408414781'),
    id(14271017, '201007982060765184'),
    id(8599070, '126806732889522176'),
    id(3958619, '185648818111512576'),
    id(20971891, '452410682214842368'),
    id(12455868, '345003515594276865'),
    id(16060432, '345670350773813250')
  ];

  await Promise.all(
    ids.map(async (id) => {
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

      await prisma.user.create({
        data: {
          apiKey: r.string(24),
          discordAccesstoken: r.string(64),
          discordRefreshToken: r.string(64),
          osuAccessToken: r.string(64),
          osuRefreshToken: r.string(64),
          isAdmin: r.boolean(),
          isRestricted: r.boolean(),
          osuUserId: osu.id,
          osuUsername: osu.username,
          discordUserId: discord.id,
          discordUsername: discord.username,
          discordDiscriminator: discord.discriminator,
          country: {
            connectOrCreate: {
              create: {
                code: osu.country.code,
                name: osu.country.name
              },
              where: {
                code: osu.country.code
              }
            }
          }
        }
      });
    })
  );

  return 'done';
}

async function seedTournaments(): Promise<'done'> {
  for (let i = 0; i < 15; i++) {
    let type = r.array(['Teams', 'Solo', 'Draft'], 1)[0];
    let rankRange: 'open rank' | { lower: number; upper: number } = r.boolean()
      ? 'open rank'
      : {
          lower: r.number(1, 500000),
          upper: r.number(1, 500000)
        };

    await prisma.tournament.create({
      data: {
        name: r.string(5, 50),
        acronym: r.string(1, 8),
        useBWS: r.boolean(),
        services: r.array(['Registrations', 'Mappooling', 'Referee', 'Stats', 'Pickems']),
        type,
        lowerRankRange: rankRange === 'open rank' ? -1 : rankRange.lower,
        upperRankRange: rankRange === 'open rank' ? -1 : rankRange.upper,
        teamSize: type === 'Teams' ? r.number(1, 8) : 1,
        teamPlaySize: type === 'Teams' ? r.number(1, 4) : 1,
        inPurchases: undefined
      },
      select: {
        id: true
      }
    });
  }

  return 'done';
}

async function seedStaffMembers(): Promise<'done'> {
  let tournaments = await prisma.tournament.findMany({
    select: {
      id: true
    }
  });
  let users = await prisma.user.findMany({
    select: {
      id: true
    }
  });

  for (let i = 0; i < tournaments.length; i++) {
    let staffMembers: { id: number }[] = [];
    for (let e = 0; e < users.length; e++) {
      if (r.boolean()) {
        staffMembers.push(
          await prisma.staffMember.create({
            data: {
              userId: users[e].id,
              tournamentId: tournaments[i].id
            },
            select: {
              id: true
            }
          })
        );
      }
    }

    for (let e = 0; e < 10; e++) {
      await prisma.staffRole.create({
        data: {
          name: `${e}_${r.string(1, 23)}`,
          color: 'Blue',
          permissions: r.array([
            'MutateTournament',
            'MutateStaffMembers',
            'MutateRegs',
            'MutatePoolStructure',
            'MutatePoolSuggestions',
            'MutateMapsToPlaytest',
            'MutateMatches',
            'MutateStats',
            'CanPlay'
          ]),
          tournamentId: tournaments[i].id,
          staffMembers: {
            connect: staffMembers.filter(() => r.boolean())
          }
        }
      });
    }
  }

  return 'done';
}

async function main() {
  // Deletes all rows in the database (https://dba.stackexchange.com/questions/154061/delete-all-data-in-postgres-database)
  await prisma.$queryRaw`
    DO
    $$
    DECLARE
      l_stmt text;
    BEGIN
      SELECT 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
        INTO l_stmt
      FROM pg_tables
      WHERE schemaname IN ('public');

      EXECUTE l_stmt;
    END;
    $$
  `;

  console.log('Users: ');
  console.log(await seedUsers());

  console.log('Tournaments: ');
  console.log(await seedTournaments());

  console.log('Staff of tournaments: ');
  console.log(await seedStaffMembers());
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

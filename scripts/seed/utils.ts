import { dbCountry, dbUser } from '../../src/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { File, Blob } from '@web-std/file';
import type { Client as OsuClient } from 'osu-web.js';
import type { User as DiscordUser } from 'discord-oauth2';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Randomize values
 */
export const r = {
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

export function id(osu: number, discord: string) {
  return { osu, discord };
}

export async function fetchUserData(
  ids: {
    osu: number;
    discord: string;
  }[],
  db: PostgresJsDatabase,
  osuClient: OsuClient,
  discordBotToken: string
) {
  let splitIds: (typeof ids)[] = [];

  for (let i = 0; i < ids.length; i++) {
    if (i % 3 === 0) {
      splitIds.push([ids[i]]);
    } else {
      splitIds[splitIds.length - 1].push(ids[i]);
    }
  }

  let users: {
    apiKey: string;
    discordAccesstoken: string;
    discordRefreshToken: string;
    osuAccessToken: string;
    osuRefreshToken: string;
    isAdmin: boolean;
    isRestricted: boolean;
    osuUserId: number;
    osuUsername: string;
    rank: number;
    discordUserId: string;
    discordUsername: string;
    discordDiscriminator: string;
    countryCode: string;
  }[] = [];
  let countries: {
    name: string;
    code: string;
  }[] = [];

  for (let i = 0; i < splitIds.length; i++) {
    await Promise.all(
      splitIds[i].map(async (id) => {
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
            Authorization: `Bot ${discordBotToken}`
          }
        });
        let discord = (await discordResp.json()) as DiscordUser;

        users.push({
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
          countryCode: osu.country.code
        });
        countries.push({
          code: osu.country.code,
          name: osu.country.name
        });
      })
    );

    await sleep(1000);
  }

  await db.insert(dbCountry).values(countries).onConflictDoNothing({
    target: dbCountry.code
  });

  let userSelect = {
    id: dbUser.id,
    osuUserId: dbUser.osuUserId
  };

  let insertedUsers = await db
    .insert(dbUser)
    .values(
      users.map((user) => {
        let countryQuery = db
          .select({
            id: dbCountry.id
          })
          .from(dbCountry)
          .where(eq(dbCountry.code, user.countryCode));

        return {
          ...user,
          countryId: sql`(${countryQuery})`
        };
      })
    )
    .onConflictDoNothing({
      target: dbUser.osuUserId
    })
    .returning(userSelect);

  if (insertedUsers.length === users.length) {
    return insertedUsers;
  }

  let conflictingUsers = await db
    .select(userSelect)
    .from(dbUser)
    .where(
      inArray(
        dbUser.id,
        insertedUsers.map((user) => user.id)
      )
    );

  return [...insertedUsers, ...conflictingUsers];
}

export function bufferToFile(buffer: Buffer, fileName: string) {
  return new File([new Blob([buffer]) as unknown as BlobPart], fileName, {
    lastModified: new Date().getTime()
  });
}

export async function upload(
  storageEndpoint: string,
  storagePassword: string,
  path: string,
  file: File
) {
  await fetch(`${storageEndpoint}/${path}`, {
    method: 'PUT',
    headers: {
      'AccessKey': storagePassword,
      'content-type': 'application/octet-stream'
    },
    body: file
  });
}

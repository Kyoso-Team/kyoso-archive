// import { dbCountry, dbUser } from '../../src/db/schema';
// import { eq, inArray, sql } from 'drizzle-orm';
// import { File, Blob } from '@web-std/file';
// import type { Client as OsuClient } from 'osu-web.js';
// import type { User as DiscordUser } from 'discord-oauth2';
// import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Randomize values
 */
export const r = {
  boolean: (chance: number = 0.5) => {
    return Math.random() < chance;
  },
  string: (min: number, max: number = min) => {
    const length = r.number(min, max);
    return [...Array(length)].map(() => (Math.random() || 0.69).toString(36)[2]).join('');
  },
  number: (min: number, max: number = min, exclude: number[] = []): number => {
    const result = Math.floor(Math.random() * (max + 1 - min) + min);
    return exclude.find((value) => value === result) ? r.number(min, max, exclude) : result;
  },
  ip: () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
  },
  loremIpsum: () => {
    return 'Lorem ipsum dolor sit amet. Ab Quis laborum et quaerat quos ut iure quasi est nihil possimus a voluptas facilis est animi fugit. Non nesciunt earum id deserunt unde non tempore esse ut rerum molestiae.';
  }
};

export function userIds(osuUserId: number, discordUserId: string) {
  return { osuUserId, discordUserId };
}

// export function bufferToFile(buffer: Buffer, fileName: string) {
//   return new File([new Blob([buffer]) as unknown as BlobPart], fileName, {
//     lastModified: new Date().getTime()
//   });
// }

// export async function upload(
//   storageEndpoint: string,
//   storagePassword: string,
//   path: string,
//   file: File
// ) {
//   await fetch(`${storageEndpoint}/${path}`, {
//     method: 'PUT',
//     headers: {
//       'AccessKey': storagePassword,
//       'content-type': 'application/octet-stream'
//     },
//     body: file
//   });
// }

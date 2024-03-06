import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { and, inArray, not, sql } from 'drizzle-orm';
import { Client as OsuClient, Auth as OsuAuth } from 'osu-web.js';
import { config } from 'dotenv';
import { createSpinner } from 'nanospinner';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tournament5wc2023 } from './tournaments/5wc_2023';
import { getEnv } from '../env';
import { r } from './utils';
import { Ban, Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, Session, User } from '../../src/lib/server/db/schema';
import type { OAuthToken } from '../../src/lib/types';
import type { User as DiscordOAuthUser } from 'discord-oauth2';
import type { UserExtended } from 'osu-web.js';

config(); 

async function main() {
  let spinner = createSpinner('Setup').start();

  const env = getEnv();
  const pg = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(pg);

  const osuAuth = new OsuAuth(env.PUBLIC_OSU_CLIENT_ID, env.OSU_CLIENT_SECRET, env.PUBLIC_OSU_REDIRECT_URI);
  const osuToken = await osuAuth.clientCredentialsGrant();
  const osuClient = new OsuClient(osuToken.access_token);

  spinner.success();
  spinner = createSpinner('Reset storage bucket').start();

  const folders = ['tournament-banners', 'tournament-logos'];
  
  await Promise.all(
    folders.map(async (folder) => {
      await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folder}/`, {
        method: 'DELETE',
        headers: {
          AccessKey: env.BUNNY_PASSWORD
        }
      });
    })
  );
  
  spinner.success();
  spinner = createSpinner('Reset database').start();
  
  await db.execute(sql`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA drizzle;
  `);
  
  spinner.success();
  spinner = createSpinner('Apply migrations').start();
  
  await migrate(db, {
    migrationsFolder: `${process.cwd()}/migrations`
  });

  spinner.success();

  const cacheExists = existsSync(`${process.cwd()}/.seed-cache`);
  
  if (cacheExists) {
    console.warn('\nCache exists. This will make the seeding faster, but it might be using outdated data. Delete the ".seed-cache" folder in the root directory to delete the cache\n');
  } else {
    console.warn('\nNo cache was found. Seeding will take longer, but responses from external APIs will be cached to make future seedings faster\n');
    mkdirSync(`${process.cwd()}/.seed-cache`);
  }

  spinner = createSpinner('Fetch users').start();

  const tournamentsData = [tournament5wc2023];
  const userIds = [...new Map(tournamentsData.map((t) => t.users).flat().map(v => [v.osuUserId, v])).values()];

  const countriesInsert: (typeof Country.$inferInsert)[] = [];
  const osuBadgesInsert: (typeof OsuBadge.$inferInsert)[] = [];
  const osuUserAwardedBadges: {
    osuUserId: number;
    awardedAt: Date;
    imgFileName: string;
  }[] = [];
  const osuUsersInsert: (typeof OsuUser.$inferInsert)[] = [];
  const discordUsersInsert: (typeof DiscordUser.$inferInsert)[] = [];
  const usersInsert: (typeof User.$inferInsert)[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const { discordUserId, osuUserId } = userIds[i];

    const osuUserCachePath = `${process.cwd()}/.seed-cache/osu-${osuUserId.toString()}.json`;
    const discordUserCachePath = `${process.cwd()}/.seed-cache/discord-${discordUserId.toString()}.json`;
    let osu: UserExtended;
    let discord: DiscordOAuthUser;

    if (existsSync(osuUserCachePath)) {
      const content = readFileSync(osuUserCachePath, {
        encoding: 'utf-8'
      });
      osu = JSON.parse(content);
    } else {
      osu = await osuClient.users.getUser(osuUserId, {
        query: {
          key: 'id'
        },
        urlParams: {
          mode: 'osu'
        }
      });

      writeFileSync(osuUserCachePath, JSON.stringify(osu), {
        encoding: 'utf-8'
      });
    }
  
    if (existsSync(discordUserCachePath)) {
      const content = readFileSync(discordUserCachePath, {
        encoding: 'utf-8'
      });
      discord = JSON.parse(content);
    } else {
      const resp = await fetch(`https://discord.com/api/users/${discordUserId}`, {
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
        }
      });
      discord = await resp.json();

      writeFileSync(discordUserCachePath, JSON.stringify(discord), {
        encoding: 'utf-8'
      });
    }

    countriesInsert.push({
      code: osu.country.code,
      name: osu.country.name
    });

    osuUsersInsert.push({
      countryCode: osu.country.code,
      osuUserId: osu.id,
      restricted: r.boolean(),
      username: osu.username,
      globalStdRank: osu.statistics.global_rank,
      token: {
        accesstoken: r.string(32),
        refreshToken: r.string(32),
        tokenIssuedAt: new Date().getTime()
      } as OAuthToken
    });

    osuBadgesInsert.push(
      ...osu.badges.map(({ description, image_url }) => ({
        description,
        imgFileName: image_url.split('/').at(-1) || ''
      }))
    );
    
    osuUserAwardedBadges.push(
      ...osu.badges.map(({ awarded_at, image_url }) => ({
        awardedAt: new Date(awarded_at),
        osuUserId: osu.id,
        imgFileName: image_url.split('/').at(-1) || ''
      }))
    );

    discordUsersInsert.push({
      discordUserId: discord.id,
      username: discord.username,
      token: {
        accesstoken: r.string(32),
        refreshToken: r.string(32),
        tokenIssuedAt: new Date().getTime()
      } as OAuthToken
    });

    usersInsert.push({
      discordUserId: discord.id,
      osuUserId: osu.id,
      admin: r.boolean(0.15),
      apiKey: r.string(24),
      approvedHost:  r.boolean(0.35),
      registeredAt: new Date(r.number(1704067200000, 1706659200000))
    });
  }

  spinner.success();
  spinner = createSpinner('Seed countries').start();

  await db
    .insert(Country)
    .values(countriesInsert)
    .onConflictDoNothing();

  spinner.success();
  spinner = createSpinner('Seed users').start();

  await db
    .insert(OsuUser)
    .values(osuUsersInsert);

  await db
    .insert(DiscordUser)
    .values(discordUsersInsert);

  const users = await db
    .insert(User)
    .values(usersInsert)
    .returning({
      id: User.id,
      admin: User.admin,
      registeredAt: User.registeredAt
    });

  const nonAdmins = users.filter(({ admin }) => !admin);
  const admins = users.filter(({ admin }) => admin);

  spinner.success();
  spinner = createSpinner('Seed badges').start();

  await db
    .insert(OsuBadge)
    .values(osuBadgesInsert)
    .onConflictDoNothing();

  const badges = await db
    .select({
      id: OsuBadge.id,
      imgFileName: OsuBadge.imgFileName
    })
    .from(OsuBadge);

  const osuUserAwardedBadgesInsert: typeof OsuUserAwardedBadge.$inferInsert[] = osuUserAwardedBadges.map(({ awardedAt, osuUserId, imgFileName }) => ({
    awardedAt,
    osuUserId,
    osuBadgeId: badges.find(({ imgFileName: imgFileName1 }) => imgFileName1 === imgFileName)!.id
  }));

  await db
    .insert(OsuUserAwardedBadge)
    .values(osuUserAwardedBadgesInsert);

  spinner.success();
  spinner = createSpinner('Seed sessions').start();

  const sessionsInsert: (typeof Session.$inferInsert)[] = users.map((user) => {
    const sessions: (typeof Session.$inferInsert)[] = [];

    for (let i = 0; i < 5; i++) {
      const createdAt = i === 0 ? user.registeredAt : new Date(r.number(1706745600000, 1707955200000));
      
      sessions.push({
        createdAt,
        lastActiveAt: createdAt,
        ipAddress: r.ip(),
        ipMetadata: {
          city: 'Some US city',
          region: 'Some US region',
          country: 'US'
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        userId: user.id,
        expired: i < 3
      });
    }

    return sessions;
  }).flat();

  await db
    .insert(Session)
    .values(sessionsInsert);

  spinner.success();
  spinner = createSpinner('Seed bans').start();

  const usersToBan = Array.from({ length: 15 }, () => nonAdmins[r.number(0, nonAdmins.length - 1)]);
  const userToBanIds = usersToBan.map(({ id }) => id);

  const bansInsert: (typeof Ban.$inferInsert)[] = usersToBan.map((user) => {
    const bans: (typeof Ban.$inferInsert)[] = [];

    const base = {
      banReason: r.loremIpsum(),
      issuedByUserId: admins[r.number(0, admins.length - 1)].id,
      issuedToUserId: user.id
    };

    bans.push({
      ...base,
      issuedAt: new Date(1708041600000),
      liftAt: new Date(1708128000000)
    });

    bans.push({
      ...base,
      issuedAt: new Date(1708214400000),
      liftAt: new Date(1708225200000),
      revokedAt: new Date(1708236000000),
      revokedByUserId: admins[r.number(0, admins.length - 1)].id,
      revokeReason: r.loremIpsum()
    });

    bans.push({
      ...base,
      issuedAt: new Date(1708311600000),
      liftAt: null,
      revokedAt: new Date(1708322400000),
      revokedByUserId: admins[r.number(0, admins.length - 1)].id,
      revokeReason: r.loremIpsum()
    });

    bans.push({
      ...base,
      issuedAt: new Date(1708333200000),
      liftAt: null
    });

    return bans;
  }).flat();

  await db
    .insert(Ban)
    .values(bansInsert);

  await db
    .update(User)
    .set({
      approvedHost: false
    })
    .where(inArray(User.id, userToBanIds));

  await db
    .update(Session)
    .set({
      expired: true
    })
    .where(and(
      inArray(Session.userId, userToBanIds),
      not(Session.expired)
    ));

  spinner.success();
  console.log('Seeding complete');
}

main().then(() => process.exit(0));

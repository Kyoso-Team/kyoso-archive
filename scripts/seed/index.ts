import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import { Client as OsuClient, Auth as OsuAuth } from 'osu-web.js';
import { config } from 'dotenv';
import { z } from 'zod';
import { createSpinner } from 'nanospinner';
import { seedUsers } from './users';
import { seedTeamTournament } from './team-tournament';
import { seedRealTournament } from './real-tournament';

config();

async function main() {
  console.log(
    '\nBegin database seeding',
    '\nGrab a cup of coffee, this might take a minute ☕\n'
  );

  let spinner = createSpinner('Setup').start();

  let env = z
    .object({
      osuClientId: z.number(),
      osuClientSecret: z.string(),
      osuRedirectUri: z.string(),
      discordBotToken: z.string(),
      databaseUrl: z.string(),
      storageEndpoint: z.string(),
      storagePassword: z.string()
    })
    .parse({
      osuClientId: Number(process.env.PUBLIC_OSU_CLIENT_ID),
      osuClientSecret: process.env.OSU_CLIENT_SECRET,
      osuRedirectUri: process.env.PUBLIC_OSU_REDIRECT_URI,
      discordBotToken: process.env.DISCORD_BOT_TOKEN,
      databaseUrl: process.env.DATABASE_URL,
      storageEndpoint: process.env.STORAGE_ENDPOINT,
      storagePassword: process.env.STORAGE_PASSWORD
    });
  
  let pg = postgres(env.databaseUrl, { max: 1 });
  let db = drizzle(pg);
  
  let osuAuth = new OsuAuth(env.osuClientId, env.osuClientSecret, env.osuRedirectUri);
  let osuToken = await osuAuth.clientCredentialsGrant();
  let osuClient = new OsuClient(osuToken.access_token);

  spinner.success();
  spinner = createSpinner('Reset storage bucket').start();

  let folders = ['tournament-banners', 'tournament-logos'];

  await Promise.all(
    folders.map(async (folder) => {
      await fetch(`${env.storageEndpoint}/${folder}/`, {
        method: 'DELETE',
        headers: {
          AccessKey: env.storagePassword
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

  let userCount = await seedUsers(db, osuClient, env.discordBotToken);
  await seedTeamTournament(db, osuClient, env.discordBotToken, userCount);
  await seedRealTournament(db, osuClient, env.discordBotToken, env.storageEndpoint, env.storagePassword);

  console.log('Database seeded successfully!');
}

main().then(() => process.exit(0));

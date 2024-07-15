import './utils/polyfill';
import { db, dbClient } from '$db';
import { resetDatabase } from '$lib/server/helpers/queries';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export async function setup() {
  await resetDatabase();
  await migrate(db, { migrationsFolder: `${process.cwd()}/migrations` });
}

export async function teardown() {
  await dbClient.end();
}

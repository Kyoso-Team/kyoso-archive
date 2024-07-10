import env from '$lib/server/env';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

export const dbClient = postgres(env.DATABASE_URL, {
  debug: true
});
export const db = drizzle(dbClient);

export { uniqueConstraints } from './schema-utils';
export * from './schema';

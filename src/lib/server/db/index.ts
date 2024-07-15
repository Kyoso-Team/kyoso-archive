import env from '$lib/server/env';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const dbUrl = env.ENV === 'automatic_testing' && env.AUTO_TESTING_DATABASE_URL
  ? env.AUTO_TESTING_DATABASE_URL
  : env.DATABASE_URL;

export const dbClient = postgres(dbUrl, {
  debug: true,
  onnotice: env.ENV === 'automatic_testing' ? (() => false) : undefined
});
export const db = drizzle(dbClient);

export { uniqueConstraints } from './schema-utils';
export * from './schema';

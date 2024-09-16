import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$lib/server/env';

const client = postgres(env.TEST_ENV === 'automatic' ? env.TEST_DATABASE_URL : env.DATABASE_URL, {
  debug: true,
  onnotice: () => {}
});
export const db = drizzle(client);

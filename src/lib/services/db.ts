import postgres from 'postgres';
import { env } from '$lib/server/env';
import { drizzle } from 'drizzle-orm/postgres-js';

const client = postgres(env.DATABASE_URL, {
  debug: true
});
export const db = drizzle(client);

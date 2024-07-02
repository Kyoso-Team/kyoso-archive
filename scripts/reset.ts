import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { getEnv } from './env';

async function main() {
  const env = getEnv();
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  await db.execute(sql`
    DROP EXTENSION IF EXISTS pg_trgm CASCADE;
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA drizzle;
  `);

  console.log('Reset database successfully');
}

main().then(() => process.exit(0));

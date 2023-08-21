import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from 'dotenv';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

config();
const dbUrl = z.string().nonempty().parse(process.env.DATABASE_URL);

async function main() {
  const pg = postgres(dbUrl, { max: 1 });
  const client = drizzle(pg);

  await client.execute(sql`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA drizzle;
  `);

  console.log('Reset database successfully');
}

main().then(() => process.exit(0));

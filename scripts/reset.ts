import './polyfill';
import { db } from '$db';
import { sql } from 'drizzle-orm';


async function main() {
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

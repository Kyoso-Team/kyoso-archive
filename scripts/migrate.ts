import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from 'dotenv';
import { z } from 'zod';

config();
const dbUrl = z.string().min(1).parse(process.env.DATABASE_URL);

async function main() {
  const pg = postgres(dbUrl, { max: 1 });
  const client = drizzle(pg);

  await migrate(client, {
    migrationsFolder: `${process.cwd()}/migrations`
  });

  console.log('Applied migrations successfully');
}

main().then(() => process.exit(0));

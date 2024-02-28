import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getEnv } from './env';

async function main() {
  const env = getEnv();
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  await migrate(db, {
    migrationsFolder: `${process.cwd()}/migrations`
  });

  console.log('Applied migrations successfully');
}

main().then(() => process.exit(0));

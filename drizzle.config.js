import { defineConfig } from 'drizzle-kit';

/** @type { import("drizzle-kit").Config } */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  driver: 'pg',
  verbose: true,
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
});

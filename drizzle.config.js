import { defineConfig } from 'drizzle-kit';

/** @type { import("drizzle-kit").Config } */
export default defineConfig({
  schema: './src/db/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
});

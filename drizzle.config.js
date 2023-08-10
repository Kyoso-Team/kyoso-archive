import { config } from 'dotenv';

config();

/** @type { import("drizzle-kit").Config } */
export default {
  schema: './src/lib/db/schema/index.ts',
  out: './migrations',
  driver: 'pg',
  verbose: true,
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
};

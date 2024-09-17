import 'dotenv/config';
import { clientEnv, parseEnv } from '$lib/env';
import { serverEnvSchema } from '$lib/validation';

const serverEnv = {
  ...clientEnv,
  NODE_ENV: process.env.NODE_ENV === 'test' ? 'development' : 'production',
  TEST_ENV: process.env.TEST_ENV === 'undefined' ? undefined : process.env.NODE_ENV === 'test' ? 'automatic' : 'manual',
  JWT_SECRET: process.env.JWT_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  IPINFO_ACCESS_TOKEN: process.env.IPINFO_ACCESS_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
  OWNER: Number(process.env.OWNER),
  TESTERS: (JSON.parse(process.env.TESTERS || '[]') as string[]).map((id) => Number(id)),
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === 'true',
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY
};

export const env = parseEnv(serverEnvSchema, serverEnv);

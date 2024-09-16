import 'dotenv/config';
import * as v from 'valibot';
import { clientEnvSchema, clientEnv, parseEnv } from '$lib/env';
import { nonEmptyStringSchema } from '$lib/validation';

const serverEnvSchema = v.object({
  ...clientEnvSchema.entries,
  NODE_ENV: v.union(
    [v.literal('production'), v.literal('development')],
    'be equal to "production" or "development"'
  ),
  TEST_ENV: v.union(
    [v.literal('automatic'), v.literal('manual'), v.undefined_()],
    'be equal to "automatic", "manual" or undefined'
  ),
  JWT_SECRET: nonEmptyStringSchema,
  CRON_SECRET: nonEmptyStringSchema,
  OSU_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_BOT_TOKEN: nonEmptyStringSchema,
  IPINFO_ACCESS_TOKEN: nonEmptyStringSchema,
  DATABASE_URL: nonEmptyStringSchema,
  TEST_DATABASE_URL: nonEmptyStringSchema,
  OWNER: v.number('be a number', [v.integer('be an integer')]),
  TESTERS: v.array(v.number('be a number', [v.integer('be an integer')]), 'be an array'),
  UPSTASH_REDIS_REST_URL: nonEmptyStringSchema,
  UPSTASH_REDIS_REST_TOKEN: nonEmptyStringSchema,
  S3_FORCE_PATH_STYLE: v.boolean('be a boolean'),
  S3_ENDPOINT: nonEmptyStringSchema,
  S3_REGION: nonEmptyStringSchema,
  S3_ACCESS_KEY_ID: nonEmptyStringSchema,
  S3_SECRET_ACCESS_KEY: nonEmptyStringSchema
});

const serverEnv = {
  ...clientEnv,
  NODE_ENV: process.env.NODE_ENV,
  TEST_ENV: process.env.TEST_ENV === 'undefined' ? undefined : process.env.TEST_ENV,
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

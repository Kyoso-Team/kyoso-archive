import * as v from 'valibot';
import {
  NODE_ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  OWNER,
  DATABASE_URL,
  TEST_DATABASE_URL,
  TESTERS,
  TEST_ENV,
  IPINFO_ACCESS_TOKEN,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  CRON_SECRET,
  S3_FORCE_PATH_STYLE,
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY
} from '$env/static/private';
import { clientEnvSchema, clientEnv, nonEmptyStringSchema, parseEnv } from '../env';

const serverEnvSchema = v.object({
  ...clientEnvSchema.entries,
  /** Preferrably, use `ENV` instead. This is mainly for Vite, but it does have its use cases */
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
  NODE_ENV,
  TEST_ENV: TEST_ENV === 'undefined' ? undefined : TEST_ENV,
  JWT_SECRET,
  CRON_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  IPINFO_ACCESS_TOKEN,
  DATABASE_URL,
  TEST_DATABASE_URL,
  OWNER: Number(OWNER),
  TESTERS: (JSON.parse(TESTERS || '[]') as string[]).map((id) => Number(id)),
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  S3_FORCE_PATH_STYLE: S3_FORCE_PATH_STYLE === 'true',
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY
};

export const env = parseEnv(serverEnvSchema, serverEnv);


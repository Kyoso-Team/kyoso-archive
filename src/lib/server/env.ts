import * as v from 'valibot';
import {
  NODE_ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  BUNNY_HOSTNAME,
  BUNNY_USERNAME,
  BUNNY_PASSWORD,
  ADMIN_BY_DEFAULT,
  DATABASE_URL,
  TESTERS,
  ENV,
  IPINFO_API_ACCESS_TOKEN
} from '$env/static/private';
import { clientEnvSchema, clientEnv, nonEmptyStringSchema, parseEnv } from '../env';

const osuUserIdsSchema = v.array(
  v.number(
    'be a number',
    [v.integer('be an integer')]
  ),
  'be an array'
);

const serverEnvSchema = v.object({
  ...clientEnvSchema.entries,
  /** Preferrably, use `ENV` instead. This is mainly for Vite, but it does have its use cases */
  NODE_ENV: v.union(
    [v.literal('production'), v.literal('development')],
    'be equal to "production" or "development"'
  ),
  ENV: v.union(
    [v.literal('production'), v.literal('testing'), v.literal('development')],
    'be equal to "production", "testing" or "development"'
  ),
  JWT_SECRET: nonEmptyStringSchema,
  OSU_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_BOT_TOKEN: nonEmptyStringSchema,
  BUNNY_HOSTNAME: nonEmptyStringSchema,
  BUNNY_USERNAME: nonEmptyStringSchema,
  BUNNY_PASSWORD: nonEmptyStringSchema,
  IPINFO_API_ACCESS_TOKEN: nonEmptyStringSchema,
  DATABASE_URL: nonEmptyStringSchema,
  ADMIN_BY_DEFAULT: osuUserIdsSchema,
  TESTERS: osuUserIdsSchema
});

const serverEnv = {
  ...clientEnv,
  NODE_ENV,
  ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  BUNNY_HOSTNAME,
  BUNNY_USERNAME,
  BUNNY_PASSWORD,
  IPINFO_API_ACCESS_TOKEN,
  DATABASE_URL,
  ADMIN_BY_DEFAULT: (JSON.parse(ADMIN_BY_DEFAULT) as string[]).map((id) => Number(id)),
  TESTERS: (JSON.parse(TESTERS) as string[]).map((id) => Number(id))
};

const env = parseEnv(serverEnvSchema, serverEnv);
export default env;

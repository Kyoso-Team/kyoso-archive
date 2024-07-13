import { config } from 'dotenv';
import { serverEnvSchema } from '$lib/schemas';
import { parseEnv } from '$lib/helpers';

config();

const serverEnv = {
  PUBLIC_OSU_CLIENT_ID: Number(process.env.PUBLIC_OSU_CLIENT_ID),
  PUBLIC_OSU_REDIRECT_URI: process.env.PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID: process.env.PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI: process.env.PUBLIC_DISCORD_MAIN_REDIRECT_URI,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI: process.env.PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI,
  PUBLIC_CONTACT_EMAIL: process.env.PUBLIC_CONTACT_EMAIL || 'example@gmail.com',
  // Vitest sets NODE_ENV to 'test', but this is not supported by SvelteKit, so we'll set it to 'development' instead
  NODE_ENV: process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV,
  ENV: process.env.ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  BUNNY_HOSTNAME: process.env.BUNNY_HOSTNAME,
  BUNNY_USERNAME: process.env.BUNNY_USERNAME,
  BUNNY_PASSWORD: process.env.BUNNY_PASSWORD,
  IPINFO_ACCESS_TOKEN: process.env.IPINFO_ACCESS_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  OWNER: Number(process.env.OWNER),
  TESTERS: (JSON.parse(process.env.TESTERS || '[]') as string[]).map((id) => Number(id)),
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
};

const env = parseEnv(serverEnvSchema, serverEnv);
export default env;

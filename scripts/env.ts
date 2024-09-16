import { config } from 'dotenv';
import * as v from 'valibot';

config();

const nonEmptyStringSchema = v.string('be a string', [v.minLength(1, 'have 1 character or more')]);

const clientEnvSchema = v.object({
  PUBLIC_OSU_CLIENT_ID: v.number('be a number', [v.integer('be an integer')]),
  PUBLIC_OSU_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_DISCORD_CLIENT_ID: nonEmptyStringSchema,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_CONTACT_EMAIL: v.string('be a string', [v.email('be an email')])
});

const serverEnvSchema = v.object({
  ...clientEnvSchema.entries,
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
  IPINFO_ACCESS_TOKEN: nonEmptyStringSchema,
  DATABASE_URL: nonEmptyStringSchema,
  OWNER: v.number('be a number', [v.integer('be an integer')]),
  TESTERS: v.array(v.number('be a number', [v.integer('be an integer')]), 'be an array')
});

export function getEnv() {
  const parsed = v.safeParse(serverEnvSchema, {
    PUBLIC_OSU_CLIENT_ID: Number(process.env.PUBLIC_OSU_CLIENT_ID),
    PUBLIC_OSU_REDIRECT_URI: process.env.PUBLIC_OSU_REDIRECT_URI,
    PUBLIC_DISCORD_CLIENT_ID: process.env.PUBLIC_DISCORD_CLIENT_ID,
    PUBLIC_DISCORD_MAIN_REDIRECT_URI: process.env.PUBLIC_DISCORD_MAIN_REDIRECT_URI,
    PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI:
      process.env.PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI,
    PUBLIC_CONTACT_EMAIL: process.env.PUBLIC_CONTACT_EMAIL || 'example@gmail.com',
    NODE_ENV: process.env.NODE_ENV,
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
    TESTERS: (JSON.parse(process.env.TESTERS || '[]') as string[]).map((id) => Number(id))
  });

  if (!parsed.success) {
    const issues = v.flatten(parsed.issues).nested;

    for (const key in issues) {
      const split = key.split('.');
      console.error(
        `Env. variable "${split[0]}"${split[1] ? ` (at index ${split[1]})` : ''} must ${issues[key]}`
      );
    }

    throw new Error('Invalid environment variables');
  }

  return parsed.output;
}

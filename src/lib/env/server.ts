import { z } from 'zod';
import {
  NODE_ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  STORAGE_ENDPOINT,
  STORAGE_PASSWORD,
  ADMIN_BY_DEFAULT,
  DATABASE_URL,
  TESTERS,
  ENV
} from '$env/static/private';
import { clientEnvSchema, clientEnv } from './client';

const serverEnvSchema = z
  .object({
    /** Preferrably, use `ENV` instead. This is mainly for Vite, but it does have its use cases */
    NODE_ENV: z.union([z.literal('production'), z.literal('development')]),
    ENV: z.union([z.literal('production'), z.literal('testing'), z.literal('development')]),
    JWT_SECRET: z.string().min(1),
    OSU_CLIENT_SECRET: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    DISCORD_BOT_TOKEN: z.string().min(1),
    STORAGE_ENDPOINT: z.string().min(1),
    STORAGE_PASSWORD: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    ADMIN_BY_DEFAULT: z.array(z.number().int()),
    TESTERS: z.array(z.number().int())
  })
  .merge(clientEnvSchema);

const serverEnv = {
  ...clientEnv,
  NODE_ENV,
  ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  STORAGE_ENDPOINT,
  STORAGE_PASSWORD,
  DATABASE_URL,
  ADMIN_BY_DEFAULT: (JSON.parse(ADMIN_BY_DEFAULT) as string[]).map((id) => Number(id)),
  TESTERS: (JSON.parse(TESTERS) as string[]).map((id) => Number(id))
};

function env() {
  const parsed = serverEnvSchema.safeParse(serverEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export default env();

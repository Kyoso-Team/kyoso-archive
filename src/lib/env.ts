import { z } from 'zod';
import {
  PUBLIC_OSU_CLIENT_ID,
  PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI,
  PUBLIC_CONTACT_EMAIL
} from '$env/static/public';

export const clientEnvSchema = z.object({
  PUBLIC_OSU_CLIENT_ID: z.number().int(),
  PUBLIC_OSU_REDIRECT_URI: z.string().min(1),
  PUBLIC_DISCORD_CLIENT_ID: z.string().min(1),
  PUBLIC_DISCORD_MAIN_REDIRECT_URI: z.string().min(1),
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI: z.string().min(1),
  PUBLIC_CONTACT_EMAIL: z.string().email().min(1)
});

export const clientEnv = {
  PUBLIC_OSU_CLIENT_ID: Number(PUBLIC_OSU_CLIENT_ID),
  PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI,
  PUBLIC_CONTACT_EMAIL
};

function parseEnv() {
  const parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

const env = parseEnv();
export default env;

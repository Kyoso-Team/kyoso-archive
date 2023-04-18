import { z } from 'zod';
import {
  PUBLIC_SUPER_USER,
  PUBLIC_OSU_CLIENT_ID,
  PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_REDIRECT_URI,
  PUBLIC_PAYPAL_CLIENT_ID,
  PUBLIC_CONTACT_EMAIL
} from '$env/static/public';

export const clientEnvSchema = z.object({
  PUBLIC_SUPER_USER: z.boolean(),
  PUBLIC_OSU_CLIENT_ID: z.number().int(),
  PUBLIC_OSU_REDIRECT_URI: z.string().nonempty(),
  PUBLIC_DISCORD_CLIENT_ID: z.string().nonempty(),
  PUBLIC_DISCORD_REDIRECT_URI: z.string().nonempty(),
  PUBLIC_PAYPAL_CLIENT_ID: z.string().nonempty(),
  PUBLIC_CONTACT_EMAIL: z.string().email().nonempty()
});

export const clientEnv = {
  PUBLIC_SUPER_USER: PUBLIC_SUPER_USER.toLocaleLowerCase() === 'true',
  PUBLIC_OSU_CLIENT_ID: Number(PUBLIC_OSU_CLIENT_ID),
  PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_REDIRECT_URI,
  PUBLIC_PAYPAL_CLIENT_ID,
  PUBLIC_CONTACT_EMAIL
};

function env() {
  let parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export default env();

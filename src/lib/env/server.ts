import { z } from 'zod';
import {
  NODE_ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  ADMIN_BY_DEFAULT,
  PAYPAL_CLIENT_SECRET
} from '$env/static/private';
import { clientEnvSchema, clientEnv } from './client';

const serverEnvSchema = z
  .object({
    NODE_ENV: z.union([z.literal('production'), z.literal('development')]),
    JWT_SECRET: z.string().nonempty(),
    OSU_CLIENT_SECRET: z.string().nonempty(),
    DISCORD_CLIENT_SECRET: z.string().nonempty(),
    ADMIN_BY_DEFAULT: z.array(z.number().int()),
    PAYPAL_CLIENT_SECRET: z.string().nonempty()
  })
  .merge(clientEnvSchema);

const serverEnv = {
  ...clientEnv,
  NODE_ENV,
  JWT_SECRET,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_SECRET,
  PAYPAL_CLIENT_SECRET,
  ADMIN_BY_DEFAULT: (JSON.parse(ADMIN_BY_DEFAULT) as string[]).map((id) => Number(id))
};

function env() {
  let parsed = serverEnvSchema.safeParse(serverEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export default env();

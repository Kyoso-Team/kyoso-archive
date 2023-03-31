import { z } from 'zod';
import { NODE_ENV } from '$env/static/private';
import { clientEnvSchema, clientEnv } from './client';

const serverEnvSchema = z
  .object({
    NODE_ENV: z.union([z.literal('production'), z.literal('development')])
  })
  .merge(clientEnvSchema);

const serverEnv = {
  ...clientEnv,
  NODE_ENV
};

export default function env() {
  let parsed = serverEnvSchema.safeParse(serverEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

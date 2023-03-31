import { z } from 'zod';
import { PUBLIC_SUPER_USER } from '$env/static/public';

export const clientEnvSchema = z.object({
  PUBLIC_SUPER_USER: z.boolean()
});

export const clientEnv = {
  PUBLIC_SUPER_USER: PUBLIC_SUPER_USER.toLocaleLowerCase() === 'true'
};

export default function env() {
  let parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

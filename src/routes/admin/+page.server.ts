import { env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  const isProduction = env.NODE_ENV === 'production';
  return { isProduction };
}) satisfies PageServerLoad;
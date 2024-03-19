import env from '$lib/server/env';
import { getSession } from '$lib/server/helpers/api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies);
  const isDevEnv = env.ENV === 'development';

  return { session, isDevEnv };
}) satisfies LayoutServerLoad;

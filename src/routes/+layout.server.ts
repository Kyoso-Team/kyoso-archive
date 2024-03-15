import { getSession } from '$lib/server/helpers/api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies);
  return { session };
}) satisfies LayoutServerLoad;

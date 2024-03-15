import { error } from '@sveltejs/kit';
import { getSession } from '$lib/server/helpers/api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies, true);

  if (!session?.admin) {
    throw error(401, 'You must be an admin');
  }

  return {
    session
  };
}) satisfies LayoutServerLoad;

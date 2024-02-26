import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
  const { session } = await event.parent();

  if (!session?.admin) {
    throw error(401, 'You must be an admin');
  }

  return session;
}) satisfies LayoutServerLoad;

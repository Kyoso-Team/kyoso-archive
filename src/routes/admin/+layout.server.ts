import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
  const { session, isUserOwner } = await parent();

  if (!session?.admin) {
    throw error(401, 'You must be an admin');
  }

  return {
    session,
    isUserOwner
  };
}) satisfies LayoutServerLoad;

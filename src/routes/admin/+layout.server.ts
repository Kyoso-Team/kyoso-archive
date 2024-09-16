import { error } from '$lib/server/error';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
  const { session, isUserOwner } = await parent();

  if (!session?.admin) {
    error('layout', 'unauthorized', 'You must be an admin');
  }

  return {
    session,
    isUserOwner
  };
}) satisfies LayoutServerLoad;

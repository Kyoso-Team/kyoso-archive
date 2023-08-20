import { getStoredUser } from '$lib/server-utils';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  getStoredUser(event, true);
  let data = await event.parent();

  return {
    name: data.tournament.name
  };
}) satisfies PageServerLoad;

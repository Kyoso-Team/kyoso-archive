import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  return await parent();
}) satisfies PageServerLoad;

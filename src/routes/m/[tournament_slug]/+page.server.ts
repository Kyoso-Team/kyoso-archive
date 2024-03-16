import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  const data = await parent();
  return data;
}) satisfies PageServerLoad;

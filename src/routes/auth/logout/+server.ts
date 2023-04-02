import { getCaller } from '$trpc/caller';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async (event) => {
  const caller = await getCaller(event);
  await caller.auth.logout();

  throw redirect(302, '/');
}) satisfies RequestHandler;

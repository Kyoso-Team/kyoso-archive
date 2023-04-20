import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async (event) => {
  const caller = await getCaller(event);
  const code = event.url.searchParams.get('code');

  if (!code) {
    throw error(400, '"code" query param is undefined');
  }

  let redirectUrl = await caller.auth.handleOsuAuth(code);
  if (redirectUrl === "/") {
    await caller.auth.updateUser()
  }
  throw redirect(302, redirectUrl);
}) satisfies RequestHandler;

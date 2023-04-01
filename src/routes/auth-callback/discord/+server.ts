import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async (event) => {
  const caller = await getCaller(event);
  const code = event.url.searchParams.get('code');

  if (!code) {
    throw error(400, '"code" query param is undefined');
  }

  await caller.auth.handleDiscordAuth(code);
  await caller.auth.login();
  throw redirect(302, '/');
}) satisfies RequestHandler;

import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/context';
import { discordChangeAccountAuth } from '$lib/server/services';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const redirectUri = url.searchParams.get('redirect_uri');
  getSession('api', cookies, true);

  const discordAuthUrl = discordChangeAccountAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri ? encodeURI(redirectUri) : undefined
  });

  redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

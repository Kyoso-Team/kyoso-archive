import { redirect } from '@sveltejs/kit';
import { discordChangeAccountAuth } from '$lib/services';
import { getSession } from '$lib/server/helpers/api';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const redirectUri = url.searchParams.get('redirect_uri');
  getSession(cookies, true);

  const discordAuthUrl = discordChangeAccountAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri ? encodeURI(redirectUri) : undefined
  });

  redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

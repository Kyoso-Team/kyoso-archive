import env from '$lib/server/env';
import { buildUrl } from 'osu-web.js';
import { error, redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/helpers/api';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const session = getSession(cookies);
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;
  const dontAskConsent = url.searchParams.get('dont_ask_consent') === 'true';

  if (session) {
    error(403, "You're already logged in");
  }

  if (dontAskConsent) {
    cookies.set('dont_ask_login_consent', 'true', {
      path: '/'
    });
  }

  const osuAuthUrl = buildUrl.authRequest(
    env.PUBLIC_OSU_CLIENT_ID,
    env.PUBLIC_OSU_REDIRECT_URI,
    ['identify', 'public'],
    redirectUri
  );

  redirect(302, osuAuthUrl);
}) satisfies RequestHandler;

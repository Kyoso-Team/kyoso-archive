import env from '$lib/env/server';
import { buildUrl } from 'osu-web.js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;
  const dontAskConsent = url.searchParams.get('dont_ask_consent') === 'true';

  if (dontAskConsent) {
    cookies.set('dont_ask_login_consent', 'true', {
      path: '/'
    });
  }

  const osuAuthUrl = buildUrl.authRequest(env.PUBLIC_OSU_CLIENT_ID, env.PUBLIC_OSU_REDIRECT_URI, [
    'identify',
    'public'
  ], redirectUri);

  redirect(302, osuAuthUrl);
}) satisfies RequestHandler;

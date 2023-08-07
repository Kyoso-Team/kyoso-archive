import env from '$lib/env/server';
import { buildUrl } from 'osu-web.js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async () => {
  let authUrl = buildUrl.authRequest(env.PUBLIC_OSU_CLIENT_ID, env.PUBLIC_OSU_REDIRECT_URI, [
    'identify',
    'public'
  ]);

  throw redirect(302, authUrl);
}) satisfies RequestHandler;

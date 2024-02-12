import { error, redirect } from '@sveltejs/kit';
import { kyosoError, signJWT } from '$lib/server-utils';
import { discordAuth, osuAuth } from '$lib/constants';
import { upsertOsuUser } from '$lib/helpers';
import type { Token } from 'osu-web.js';
import type { RequestHandler } from './$types';
import type { Session } from '$types';

export const GET = (async ({ url, route, cookies }) => {
  const redirectUri = url.searchParams.get('state') || undefined;
  const code = url.searchParams.get('code');

  if (!code) {
    throw error(400, 'URL search parameter "code" is undefined');
  }

  let token!: Token;
  
  try {
    token = await osuAuth.requestToken(code);
  } catch (err) {
    throw kyosoError(err, 'Getting the osu! OAuth token', route);
  }

  const osuUser = await upsertOsuUser(token, route);

  const discordAuthUrl = discordAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri
  });

  const osuProfile: Session['osu'] = {
    id: osuUser.id,
    username: osuUser.username
  };

  cookies.set('temp_osu_profile', signJWT(osuProfile), {
    path: '/'
  });

  throw redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

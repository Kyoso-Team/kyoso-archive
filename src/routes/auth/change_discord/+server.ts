import { redirect } from '@sveltejs/kit';
import { getSession, signJWT } from '$lib/server-utils';
import { discordAuth } from '$lib/constants';
import type { Session } from '$types';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const redirectUri = url.searchParams.get('redirect_uri');
  const user = getSession(cookies, true);

  const discordAuthUrl = discordAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri ? encodeURI(redirectUri) : undefined
  });

  const osuProfile: Session['osu'] = {
    id: user.osu.id,
    username: user.osu.username
  };

  cookies.set('temp_osu_profile', signJWT(osuProfile), {
    path: '/'
  });

  throw redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

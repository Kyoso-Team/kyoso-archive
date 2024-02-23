import env from '$lib/server/env';
import { error, redirect } from '@sveltejs/kit';
import { sveltekitError, pick, signJWT, verifyJWT, getSession } from '$lib/server-utils';
import { User, db } from '$db';
import { discordMainAuth, discordMainAuthOptions } from '$lib/server/constants';
import { createSession, upsertDiscordUser } from '$lib/server/helpers';
import type DiscordOAuth2 from 'discord-oauth2';
import type { AuthSession } from '$types';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, route, cookies, getClientAddress, request }) => {
  const currentSession = getSession(cookies);
  const redirectUri = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const osuProfileCookie = cookies.get('temp_osu_profile');
  const userAgent = request.headers.get('User-Agent');

  if (currentSession) {
    error(403, 'You\'re already logged in');
  }
  
  if (!userAgent) {
    error(403, '"User-Agent" header is undefined');
  }

  if (!osuProfileCookie) {
    error(400, 'Log into osu! before logging into Discord');
  }

  const osuSessionData = verifyJWT<AuthSession['osu']>(osuProfileCookie);

  if (!osuSessionData) {
    error(500, '"temp_osu_profile" cookie is an invalid JWT string. Try logging in with osu! again');
  }

  if (!code) {
    error(400, '"code" query param is undefined');
  }

  let token!: DiscordOAuth2.TokenRequestResult;

  try {
    token = await discordMainAuth.tokenRequest({
      ...discordMainAuthOptions,
      grantType: 'authorization_code',
      scope: ['identify'],
      code
    });;
  } catch (err) {
    throw await sveltekitError(err, 'Getting the Discord OAuth token', route);
  }

  const tokenIssuedAt = new Date();
  const discordUser = await upsertDiscordUser(token, tokenIssuedAt, route);

  let user!: Pick<typeof User.$inferSelect, 'id' | 'updatedApiDataAt' | 'admin'>;

  try {
    user = await db
      .insert(User)
      .values({
        discordUserId: discordUser.id,
        osuUserId: osuSessionData.id,
        admin: env.ADMIN_BY_DEFAULT.includes(osuSessionData.id),
        approvedHost: env.ENV === 'testing'
      })
      .returning(pick(User, ['id', 'updatedApiDataAt', 'admin']))
      .then((user) => user[0]);
  } catch (err) {
    throw await sveltekitError(err, 'Creating the user', route);
  }

  const session = await createSession(user.id, getClientAddress(), userAgent, route);

  const authSession: AuthSession = {
    sessionId: session.id,
    userId: user.id,
    admin: user.admin,
    approvedHost: false,
    updatedApiDataAt: user.updatedApiDataAt.getTime(),
    discord: {
      id: discordUser.id,
      username: discordUser.username
    },
    osu: osuSessionData
  };

  cookies.delete('temp_osu_profile', {
    path: '/'
  });
  
  cookies.set('session', signJWT(authSession), {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

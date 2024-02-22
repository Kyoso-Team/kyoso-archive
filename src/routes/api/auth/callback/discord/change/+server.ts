import { error, redirect } from '@sveltejs/kit';
import { sveltekitError, signJWT, getSession } from '$lib/server-utils';
import { User, db } from '$db';
import { discordChangeAccountAuth, discordChangeAccountAuthOptions } from '$lib/server/constants';
import { upsertDiscordUser } from '$lib/server/helpers';
import type DiscordOAuth2 from 'discord-oauth2';
import type { AuthSession } from '$types';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const GET = (async ({ url, route, cookies }) => {
  const session = getSession(cookies, true);
  const redirectUri = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!code) {
    error(400, '"code" query param is undefined');
  }

  let token!: DiscordOAuth2.TokenRequestResult;

  try {
    token = await discordChangeAccountAuth.tokenRequest({
      ...discordChangeAccountAuthOptions,
      grantType: 'authorization_code',
      scope: ['identify'],
      code
    });;
  } catch (err) {
    throw await sveltekitError(err, 'Getting the Discord OAuth token', route);
  }

  const tokenIssuedAt = new Date();
  const discordUser = await upsertDiscordUser(token, tokenIssuedAt, route);

  try {
    await db
      .update(User)
      .set({
        discordUserId: discordUser.id
      })
      .where(eq(User.id, session.userId));
  } catch (err) {
    throw await sveltekitError(err, 'Updating the user', route);
  }

  const authSession: AuthSession = {
    ...session,
    discord: {
      id: discordUser.id,
      username: discordUser.username
    }
  };
  
  cookies.set('session', signJWT(authSession), {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

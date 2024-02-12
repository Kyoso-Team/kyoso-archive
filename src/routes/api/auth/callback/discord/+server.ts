import env from '$lib/env/server';
import { error, redirect } from '@sveltejs/kit';
import { kyosoError, pick, signJWT, verifyJWT } from '$lib/server-utils';
import { User, db } from '$db';
import { customAlphabet } from 'nanoid';
import { discordAuth, discordAuthOptions } from '$lib/constants';
import { sql } from 'drizzle-orm';
import { upsertDiscordUser } from '$lib/helpers';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Session } from '$types';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, route, cookies }) => {
  const redirectUri = url.searchParams.get('state') || undefined;
  const code = url.searchParams.get('code');
  const osuProfileCookie = cookies.get('temp_osu_profile');

  if (!osuProfileCookie) {
    throw error(400, 'Log into osu! before logging into Discord');
  }

  const osuProfile = verifyJWT<Session['osu']>(osuProfileCookie);

  if (!osuProfile) {
    throw error(500, '"temp_osu_profile" cookie is an invalid JWT string. Try logging in with osu! again');
  }

  if (!code) {
    throw error(400, '"code" query param is undefined');
  }

  let token!: DiscordOAuth2.TokenRequestResult;

  try {
    token = await discordAuth.tokenRequest({
      ...discordAuthOptions,
      grantType: 'authorization_code',
      scope: ['identify'],
      code
    });;
  } catch (err) {
    throw kyosoError(err, 'Getting the Discord OAuth token', route);
  }

  const discordUser = await upsertDiscordUser(token, route);

  let kyosoUser!: Pick<typeof User.$inferSelect, 'id' | 'updatedApiDataAt' | 'isAdmin'>;

  try {
    kyosoUser = await db
      .insert(User)
      .values({
        apiKey: customAlphabet(
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          24
        )(),
        discordUserId: discordUser.id,
        osuUserId: osuProfile.id,
        isAdmin: env.ADMIN_BY_DEFAULT.includes(osuProfile.id)
      })
      .onConflictDoUpdate({
        target: [User.osuUserId],
        set: {
          discordUserId: discordUser.id,
          isAdmin: env.ADMIN_BY_DEFAULT.includes(osuProfile.id),
          updatedApiDataAt: sql`now()`
        }
      })
      .returning(pick(User, ['id', 'updatedApiDataAt', 'isAdmin']))
      .then((user) => user[0]);
  } catch (err) {
    throw kyosoError(err, 'Upserting the user', route);
  }

  const kyosoProfile: Session = {
    userId: kyosoUser.id,
    isAdmin: kyosoUser.isAdmin,
    updatedAt: kyosoUser.updatedApiDataAt.getTime(),
    discord: {
      id: discordUser.id,
      username: discordUser.username
    },
    osu: {
      id: osuProfile.id,
      username: osuProfile.username
    }
  };

  cookies.delete('temp_osu_profile', {
    path: '/'
  });
  
  cookies.set('session', signJWT(kyosoProfile), {
    path: '/'
  });

  if (redirectUri) {
    throw redirect(302, decodeURI(redirectUri));
  }

  throw redirect(302, '/');
}) satisfies RequestHandler;

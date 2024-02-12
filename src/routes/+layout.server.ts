import env from '$lib/env/server';
import { discordAuth, osuAuth, discordAuthOptions } from '$lib/constants';
import { kyosoError, pick, signJWT, verifyJWT } from '$lib/server-utils';
import { DiscordUser, OsuUser, User, db } from '$db';
import { eq, sql } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import { upsertDiscordUser, upsertOsuUser } from '$lib/helpers';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Session } from '$types';
import type { Token } from 'osu-web.js';
import type { LayoutServerLoad } from './$types';
import type { Cookies } from '@sveltejs/kit';

async function updateUser(session: Session, cookies: Cookies, route: Parameters<LayoutServerLoad>['0']['route']) {
  let refreshTokens!: {
    osu: string;
    discord: string;
  };

  const osuRefreshTokenQuery = db
    .select(pick(OsuUser, ['refreshToken']))
    .from(OsuUser)
    .where(eq(OsuUser.osuUserId, session.osu.id))
    .limit(1);

  const discordRefreshTokenQuery = db
    .select(pick(DiscordUser, ['refreshToken']))
    .from(DiscordUser)
    .where(eq(DiscordUser.discordUserId, session.discord.id))
    .limit(1);

  try {
    refreshTokens = await union(osuRefreshTokenQuery, discordRefreshTokenQuery)
      .then((rows) => ({
        osu: rows[0].refreshToken,
        discord: rows[1].refreshToken
      }));
  } catch (err) {
    throw kyosoError(err, 'Getting the osu! and Discord refresh tokens', route);
  }

  let osuToken!: Token;
  let discordToken!: DiscordOAuth2.TokenRequestResult;

  try {
    osuToken = await osuAuth.refreshToken(refreshTokens.osu);
  } catch (err) {
    throw kyosoError(err, 'Getting the osu! access token', route);
  }

  try {
    discordToken = await discordAuth.tokenRequest({
      ...discordAuthOptions,
      grantType: 'refresh_token',
      scope: ['identify'],
      refreshToken: refreshTokens.discord
    });
  } catch (err) {
    throw kyosoError(err, 'Getting the Discord access token', route);
  }

  const osuUser = await upsertOsuUser(osuToken, route, {
    osuUserId: session.osu.id
  });
  const discordUser = await upsertDiscordUser(discordToken, route, {
    discordUserId: session.discord.id
  });

  let kyosoUser!: {
    id: number;
    isAdmin: boolean;
    updatedApiDataAt: Date;
  };

  try {
    kyosoUser = await db
      .update(User)
      .set({
        isAdmin: env.ADMIN_BY_DEFAULT.includes(osuUser.id),
        updatedApiDataAt: sql`now()`
      })
      .where(eq(User.id, session.userId))
      .returning(pick(User, ['id', 'updatedApiDataAt', 'isAdmin']))
      .then((user) => user[0]);
  } catch (err) {
    throw kyosoError(err, 'Updating the user', route);
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
      id: osuUser.id,
      username: osuUser.username
    }
  };
  
  cookies.set('session', signJWT(kyosoProfile), {
    path: '/'
  });

  return kyosoProfile;
}

export const load = (async ({ cookies, route }) => {
  const sessionCookie = cookies.get('session');

  if (!sessionCookie) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    return { user: undefined };
  }

  let session = verifyJWT<Session>(sessionCookie);
  
  if (!session) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    cookies.delete('session', {
      path: '/'
    });

    return { user: undefined };
  }

  if (new Date().getTime() - session.updatedAt >= 86_400_000) {
    session = await updateUser(session, cookies, route);
  }

  return { user: session };
}) satisfies LayoutServerLoad;

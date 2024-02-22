import env from '$lib/server/env';
import { discordMainAuth, osuAuth, discordMainAuthOptions } from '$lib/server/constants';
import { sveltekitError, pick, signJWT, getSession } from '$lib/server-utils';
import { DiscordUser, OsuUser, User, db } from '$db';
import { eq, sql } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import { upsertDiscordUser, upsertOsuUser } from '$lib/helpers';
import type DiscordOAuth2 from 'discord-oauth2';
import type { AuthSession } from '$types';
import type { Token } from 'osu-web.js';
import type { LayoutServerLoad } from './$types';
import type { Cookies } from '@sveltejs/kit';

async function updateUser(session: AuthSession, cookies: Cookies, route: Parameters<LayoutServerLoad>['0']['route']) {
  let refreshTokens!: {
    osu: string;
    discord: string;
  };

  const osuRefreshTokenQuery = db
    .select({
      token: OsuUser.token,
      order: sql`0`.as('order')
    })
    .from(OsuUser)
    .where(eq(OsuUser.osuUserId, session.osu.id))
    .limit(1);

  const discordRefreshTokenQuery = db
    .select({
      token: DiscordUser.token,
      order: sql`1`.as('order')
    })
    .from(DiscordUser)
    .where(eq(DiscordUser.discordUserId, session.discord.id))
    .limit(1);

  try {
    refreshTokens = await union(osuRefreshTokenQuery, discordRefreshTokenQuery)
      .orderBy(sql`"order" asc`)
      .then((rows) => ({
        osu: rows[0].token.refreshToken,
        discord: rows[1].token.refreshToken
      }));
  } catch (err) {
    throw await sveltekitError(err, 'Getting the osu! and Discord refresh tokens', route);
  }

  let osuToken!: Token;
  let discordToken!: DiscordOAuth2.TokenRequestResult;

  try {
    osuToken = await osuAuth.refreshToken(refreshTokens.osu);
  } catch (err) {
    throw await sveltekitError(err, 'Getting the osu! access token', route);
  }

  const osuTokenIssuedAt = new Date();

  try {
    discordToken = await discordMainAuth.tokenRequest({
      ...discordMainAuthOptions,
      grantType: 'refresh_token',
      scope: ['identify'],
      refreshToken: refreshTokens.discord
    });
  } catch (err) {
    throw await sveltekitError(err, 'Getting the Discord access token', route);
  }

  const discordTokenIssuedAt = new Date();
  const osuUser = await upsertOsuUser(osuToken, osuTokenIssuedAt, route, {
    osuUserId: session.osu.id
  });
  const discordUser = await upsertDiscordUser(discordToken, discordTokenIssuedAt, route, {
    discordUserId: session.discord.id
  });

  let user!: {
    id: number;
    admin: boolean;
    updatedApiDataAt: Date;
  };

  try {
    user = await db
      .update(User)
      .set({
        admin: env.ADMIN_BY_DEFAULT.includes(osuUser.id),
        updatedApiDataAt: sql`now()`
      })
      .where(eq(User.id, session.userId))
      .returning(pick(User, ['id', 'updatedApiDataAt', 'admin']))
      .then((user) => user[0]);
  } catch (err) {
    throw await sveltekitError(err, 'Updating the user', route);
  }

  const kyosoProfile: AuthSession = {
    sessionId: session.sessionId,
    userId: user.id,
    admin: user.admin,
    updatedApiDataAt: user.updatedApiDataAt.getTime(),
    discord: {
      id: discordUser.id,
      username: discordUser.username
    },
    osu: {
      id: osuUser.id,
      username: osuUser.username,
      globalStdRank: osuUser.statistics.global_rank,
      restricted: osuUser.is_restricted
    }
  };
  
  cookies.set('session', signJWT(kyosoProfile), {
    path: '/'
  });

  return kyosoProfile;
}

export const load = (async ({ cookies, route }) => {
  let session = getSession(cookies);

  if (session && new Date().getTime() - session.updatedApiDataAt >= 86_400_000) {
    session = await updateUser(session, cookies, route);
  }

  return {
    session,
    testingEnv: env.ENV === 'testing'
  };
}) satisfies LayoutServerLoad;

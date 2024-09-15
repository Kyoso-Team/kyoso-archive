import postgres from 'postgres';
import { env } from '$lib/server/env';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { apiError, verifyJWT, pick, signJWT } from '$lib/server/utils';
import { redirect, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
  db,
  ratelimit,
  osuAuth,
  discordMainAuth,
  discordMainAuthOptions,
  createTRPCContext
} from '$lib/server/services';
import { Session, DiscordUser, OsuUser, User } from '$db';
import { and, eq, not, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { upsertDiscordUser, upsertOsuUser } from '$lib/server/helpers/auth';
import { ServerError } from '$lib/server/error';
import { TRPCError } from '@trpc/server';
import { isOsuJSError } from 'osu-web.js';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Token } from 'osu-web.js';
import type { Cookies, HandleServerError, Handle, RequestEvent } from '@sveltejs/kit';
import type { AuthSession } from '$types';

async function logError(err: unknown, when: string, from: string | null) {
  let message = 'Unknown error';
  let osuJSResp: Response | undefined;
  let query: string | undefined;
  let queryParams: any[] | undefined;

  if (isOsuJSError(err)) {
    message = err.message;

    if (err.type === 'unexpected_response') {
      osuJSResp = err.response();
    }
  } else if (err instanceof postgres.PostgresError) {
    message = err.message;
    query = err.query;
    queryParams = err.parameters;
  }

  message = `${message}. Error thrown when: ${when}`;
  console.error(`${new Date().toUTCString()} - ${from} - ${message}`);

  if (message.includes('Unknown error')) {
    console.log(err);
  }

  if (osuJSResp) {
    const data = await osuJSResp.text();
    console.log(`${osuJSResp.status} response from osu.js: ${data}`);
  }

  if (query && queryParams) {
    console.log(`Database query: ${query}`);
    console.log(`Query parameters: ${JSON.stringify(queryParams)}`);
  }
}

const trpcHandle = createTRPCHandle({
  router,
  createContext: createTRPCContext,
  onError: async ({ error, path }) => {
    const serverError = error.cause instanceof ServerError ? error.cause : undefined;

    if (!serverError) {
      console.error('Unhandled error in tRPC procedure');
      console.error(error);
      return;
    }

    if (!serverError.cause) return;
    await logError(serverError.cause, serverError.message.split('when: ')[1], `trpc.${path}`);
  }
});

async function verifySession({ cookies, route }: RequestEvent): Promise<
  | {
      session: AuthSession;
      updateCookie: boolean;
    }
  | undefined
> {
  const sessionCookie = cookies.get('session');

  if (route.id?.includes('/api/auth')) return;

  if (!sessionCookie) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    return;
  }

  const sessionToVerify = verifyJWT<AuthSession>(sessionCookie);
  let session!: Pick<typeof Session.$inferSelect, 'updateCookie'>;

  try {
    session = await db
      .update(Session)
      .set({
        lastActiveAt: sql`now()`
      })
      .where(and(eq(Session.id, sessionToVerify?.sessionId || 0), not(Session.expired)))
      .returning(pick(Session, ['updateCookie']))
      .then((sessions) => sessions[0]);
  } catch (err) {
    throw await apiError(err, 'Verifying the session', route);
  }

  if (sessionToVerify && session) {
    return {
      session: sessionToVerify,
      updateCookie: session.updateCookie
    };
  }

  cookies.delete('temp_osu_profile', {
    path: '/'
  });

  cookies.delete('session', {
    path: '/'
  });
}

async function updateUser(session: AuthSession, cookies: Cookies, route: { id: string | null }) {
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
    refreshTokens = await unionAll(osuRefreshTokenQuery, discordRefreshTokenQuery)
      .orderBy(sql`"order" asc`)
      .then((rows) => ({
        osu: rows[0].token.refreshToken,
        discord: rows[1].token.refreshToken
      }));
  } catch (err) {
    throw await apiError(err, 'Getting the osu! and Discord refresh tokens', route);
  }

  let osuToken!: Token;
  let discordToken!: DiscordOAuth2.TokenRequestResult;

  try {
    osuToken = await osuAuth.refreshToken(refreshTokens.osu);
  } catch (err) {
    throw await apiError(err, 'Getting the osu! access token', route);
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
    throw await apiError(err, 'Getting the Discord access token', route);
  }

  const discordTokenIssuedAt = new Date();
  const osuUser = await upsertOsuUser(osuToken, osuTokenIssuedAt, route, {
    osuUserId: session.osu.id
  });
  const discordUser = await upsertDiscordUser(discordToken, discordTokenIssuedAt, route, {
    discordUserId: session.discord.id
  });

  let user!: {
    admin: boolean;
    approvedHost: boolean;
    updatedApiDataAt: Date;
  };

  try {
    user = await db
      .update(User)
      .set({
        updatedApiDataAt: sql`now()`
      })
      .where(eq(User.id, session.userId))
      .returning(pick(User, ['updatedApiDataAt', 'approvedHost', 'admin']))
      .then((user) => user[0]);
  } catch (err) {
    throw await apiError(err, 'Updating the user', route);
  }

  const kyosoProfile: AuthSession = {
    sessionId: session.sessionId,
    userId: session.userId,
    admin: user.admin,
    approvedHost: user.approvedHost,
    updatedApiDataAt: user.updatedApiDataAt.getTime(),
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
}

const mainHandle: Handle = async ({ event, resolve }) => {
  const { url, route, cookies, getClientAddress } = event;

  const ip = getClientAddress();
  const rateLimitAttempt = await ratelimit.limit(ip);

  if (!rateLimitAttempt.success) {
    error(429, 'Too many requests. Please try again later');
  }

  const sessionData = await verifySession(event);
  const session = sessionData?.session;

  if (env.TEST_ENV === 'manual') {
    const isTester = session?.admin || env.TESTERS.includes(session?.osu.id || 0);

    if (url.pathname !== '/testers-auth' && !url.pathname.includes('/api/auth')) {
      if (!session) {
        redirect(302, '/testers-auth');
      } else if (!isTester) {
        error(401, 'You are not a tester for Kyoso');
      }
    } else if (url.pathname === '/testers-auth' && isTester) {
      redirect(302, '/');
    }
  }

  if (
    session &&
    (new Date().getTime() - session.updatedApiDataAt >= 86_400_000 || sessionData.updateCookie)
  ) {
    await updateUser(session, cookies, route);

    if (sessionData.updateCookie) {
      try {
        await db
          .update(Session)
          .set({
            updateCookie: false
          })
          .where(eq(Session.id, session.sessionId));
      } catch (err) {
        throw await apiError(err, 'Updating the session', route);
      }
    }
  }

  return await resolve(event);
};

export const handle = sequence(trpcHandle, mainHandle);

export const handleError: HandleServerError = async ({ error, event }) => {
  if (!(error instanceof ServerError) && !(error instanceof TRPCError)) {
    console.error(error);
    return { message: 'Unknown error' };
  }

  if (error instanceof TRPCError) {
    if (error.cause) {
      return { message: error.message };
    }

    return { message: 'MESSAGE FOR DEVELOPERS: Please use the `error` function to throw expected errors and `catcher` or `unknownServerError` to throw unexpected errors in tRPC procedures.' };
  }

  const route = event.route.id ?? 'unknown-route';
  const inside = error.inside === 'api' ? '(inside API route)' : error.inside === 'layout' ? '(during layout load)' : '(during page load)';
  await logError(error.cause, error.message.split('when: ')[1], `${route} ${inside}`);
  return { message: error.message };
};

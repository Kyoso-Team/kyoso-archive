import { env } from '$lib/server/env';
import { redirect } from '@sveltejs/kit';
import { signJWT, pick, future } from '$lib/server/utils';
import { upsertOsuUser, createSession } from '$lib/server/helpers/auth';
import { db, osuAuth, discordMainAuth } from '$lib/server/services';
import { Ban, DiscordUser, OsuUser, User } from '$db';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { getSession } from '$lib/server/helpers/api';
import { catcher, error } from '$lib/server/error';
import { recordExists } from '$lib/server/helpers/queries';
import type { RequestHandler } from './$types';
import type { AuthSession } from '$types';

export const GET = (async ({ url, cookies, getClientAddress, request }) => {
  const currentSession = getSession(cookies);
  const redirectUri = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const userAgent = request.headers.get('User-Agent');

  if (currentSession) {
    error('sveltekit', 'forbidden', 'Already logged in');
  }

  if (!userAgent) {
    error('sveltekit', 'bad_request', '"User-Agent" header is undefined');
  }

  if (!code) {
    error('sveltekit', 'bad_request', 'URL search parameter "code" is undefined');
  }

  const token = await osuAuth.requestToken(code).catch(catcher('api', 'Getting the osu! OAuth token'));
  // Get the osu! user ID from the token
  const accessToken = token.access_token;
  const payloadString = accessToken.substring(
    accessToken.indexOf('.') + 1,
    accessToken.lastIndexOf('.')
  );
  const payloadBuffer = Buffer.from(payloadString, 'base64').toString('ascii');
  const payload: { sub: string } = JSON.parse(payloadBuffer);
  const osuUserId = Number(payload.sub);
  const userExists = await db
    .update(User)
    .set({
      admin: env.OWNER === osuUserId,
      approvedHost: env.NODE_ENV !== 'production' || env.OWNER === osuUserId
    })
    .where(eq(User.osuUserId, osuUserId))
    .returning({
      exists: sql`1`.as('exists')
    })
    .then((user) => !!user[0]?.exists)
    .catch(catcher('api', 'Updating the user'));

  if (userExists) {
    const user = await db
      .select({
        ...pick(User, ['id', 'updatedApiDataAt', 'admin', 'approvedHost']),
        discord: pick(DiscordUser, ['discordUserId', 'username']),
        osu: pick(OsuUser, ['osuUserId', 'username'])
      })
      .from(User)
      .innerJoin(DiscordUser, eq(User.discordUserId, DiscordUser.discordUserId))
      .innerJoin(OsuUser, eq(User.osuUserId, OsuUser.osuUserId))
      .where(eq(User.osuUserId, osuUserId))
      .limit(1)
      .then((user) => user[0])
      .catch(catcher('api', 'Getting the user'));

    const isBanned = await recordExists(Ban, and(
      eq(Ban.issuedToUserId, user.id),
      and(isNull(Ban.revokedAt), or(isNull(Ban.liftAt), future(Ban.liftAt)))
    )).catch(catcher('api', 'Verifying the user\'s ban status'));

    if (isBanned) {
      error(
        'sveltekit',
        'forbidden',
        `You are banned from Kyoso. If you think this is a mistake, try logging in again or contact us at ${env.PUBLIC_CONTACT_EMAIL}`
      );
    }

    const session = await createSession('api', user.id, getClientAddress(), userAgent);

    const authSession: AuthSession = {
      sessionId: session.id,
      userId: user.id,
      admin: user.admin,
      approvedHost: user.approvedHost,
      updatedApiDataAt: user.updatedApiDataAt.getTime(),
      discord: {
        id: user.discord.discordUserId,
        username: user.discord.username
      },
      osu: {
        id: user.osu.osuUserId,
        username: user.osu.username
      }
    };

    cookies.set('session', signJWT(authSession), {
      path: '/'
    });

    if (redirectUri) {
      redirect(302, decodeURI(redirectUri));
    }

    redirect(302, '/');
  }

  const osuUser = await upsertOsuUser('api', token, new Date());

  const discordAuthUrl = discordMainAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri ? decodeURI(redirectUri) : undefined
  });

  const osuSessionData: AuthSession['osu'] = {
    id: osuUser.id,
    username: osuUser.username
  };

  cookies.set('temp_osu_profile', signJWT(osuSessionData), {
    path: '/'
  });

  redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

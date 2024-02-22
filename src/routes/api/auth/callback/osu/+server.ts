import env from '$lib/server/env';
import { error, redirect } from '@sveltejs/kit';
import { sveltekitError, signJWT, pick, getSession } from '$lib/server-utils';
import { discordMainAuth, osuAuth } from '$lib/server/constants';
import { upsertOsuUser, createSession } from '$lib/server/helpers';
import { Ban, DiscordUser, OsuUser, User, db } from '$db';
import { eq, sql } from 'drizzle-orm';
import type { Token } from 'osu-web.js';
import type { RequestHandler } from './$types';
import type { AuthSession } from '$types';

export const GET = (async ({ url, route, cookies, getClientAddress, request }) => {
  const currentSession = getSession(cookies);
  const redirectUri = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const userAgent = request.headers.get('User-Agent');

  if (currentSession) {
    error(403, 'You\'re already logged in');
  }
  
  if (!userAgent) {
    error(400, '"User-Agent" header is undefined');
  }

  if (!code) {
    error(400, 'URL search parameter "code" is undefined');
  }

  let token!: Token;
  
  try {
    token = await osuAuth.requestToken(code);
  } catch (err) {
    throw await sveltekitError(err, 'Getting the osu! OAuth token', route);
  }

  // Get the osu! user ID from the token
  const accessToken = token.access_token;
  const payloadString =  accessToken.substring(accessToken.indexOf('.') + 1, accessToken.lastIndexOf('.'));
  const payloadBuffer = Buffer.from(payloadString, 'base64').toString('ascii');
  const payload: { sub: string } = JSON.parse(payloadBuffer);
  const osuUserId = Number(payload.sub);

  let userExists!: boolean;

  try {
    userExists = await db
      .update(User)
      .set({
        admin: env.ADMIN_BY_DEFAULT.includes(osuUserId)
      })
      .where(eq(User.osuUserId, osuUserId))
      .returning({
        exists: sql`1`.as('exists')
      })
      .then((user) => !!user[0]?.exists);
  } catch (err) {
    throw await sveltekitError(err, 'Updating the user', route);
  }

  if (userExists) {
    let user: Pick<typeof User.$inferSelect, 'id' | 'updatedApiDataAt' | 'admin'> & {
      discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
      osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username' | 'globalStdRank' | 'restricted'>;
    };

    try {
      user = await db
        .select({
          ...pick(User, ['id', 'updatedApiDataAt', 'admin']),
          discord: pick(DiscordUser, ['discordUserId', 'username']),
          osu: pick(OsuUser, ['osuUserId', 'username', 'globalStdRank', 'restricted'])
        })
        .from(User)
        .innerJoin(DiscordUser, eq(User.discordUserId, DiscordUser.discordUserId))
        .innerJoin(OsuUser, eq(User.osuUserId, OsuUser.osuUserId))
        .where(eq(User.osuUserId, osuUserId))
        .limit(1)
        .then((user) => user[0]);
    } catch (err) {
      throw await sveltekitError(err, 'Getting the user', route);
    }

    const now = new Date();

    let isBanned!: boolean; 

    try {
      isBanned = await db.execute(sql`
        select exists (
          select 1 from ${Ban}
          where ${Ban.issuedToUserId} = ${user.id} and (
            ${Ban.liftAt} is null
            or (${Ban.liftAt} is not null and ${now} <= ${Ban.liftAt})
            or (${Ban.revokedAt} is not null and ${now} <= ${Ban.revokedAt})
          )
          limit 1
        )
      `).then((bans) => !!bans[0]?.exists);
    } catch (err) {
      throw await sveltekitError(err, 'Verifying the user\'s ban status', route);
    }

    if (isBanned) {
      error(403, `You are banned from Kyoso. If you think this is a mistake, try logging in again or contact us at ${env.PUBLIC_CONTACT_EMAIL}`);
    }

    const session = await createSession(user.id, getClientAddress(), userAgent, route);

    const authSession: AuthSession = {
      sessionId: session.id,
      userId: user.id,
      admin: user.admin,
      updatedApiDataAt: user.updatedApiDataAt.getTime(),
      discord: {
        id: user.discord.discordUserId,
        username: user.discord.username
      },
      osu: {
        id: user.osu.osuUserId,
        globalStdRank: user.osu.globalStdRank,
        restricted: user.osu.restricted,
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

  const osuUser = await upsertOsuUser(token, new Date(), route);

  const discordAuthUrl = discordMainAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri ? decodeURI(redirectUri) : undefined
  });

  const osuSessionData: AuthSession['osu'] = {
    id: osuUser.id,
    username: osuUser.username,
    globalStdRank: osuUser.statistics.global_rank,
    restricted: osuUser.is_restricted
  };

  cookies.set('temp_osu_profile', signJWT(osuSessionData), {
    path: '/'
  });

  redirect(302, discordAuthUrl);
}) satisfies RequestHandler;

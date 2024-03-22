import * as v from 'valibot';
import env from '$lib/server/env';
import { error } from '@sveltejs/kit';
import { getSession, parseRequestBody } from '$lib/server/helpers/api';
import { positiveIntSchema } from '$lib/schemas';
import { Ban, DiscordUser, OsuUser, Session, User, db } from '$db';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { apiError, future, pick, signJWT } from '$lib/server/utils';
import { createSession } from '$lib/server/helpers/auth';
import type { RequestHandler } from './$types';
import type { AuthSession } from '$types';

export const PUT = (async ({ cookies, route, getClientAddress, request }) => {
  if (env.ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession(cookies, true);
  const userAgent = request.headers.get('User-Agent');
  const body = await parseRequestBody(
    request,
    v.object({
      userId: positiveIntSchema
    }),
    route
  );

  if (!userAgent) {
    error(400, '"User-Agent" header is undefined');
  }

  let isBanned!: boolean;

  try {
    isBanned = await db
      .execute(
        sql`
    select exists (
      select 1 from ${Ban}
      where ${and(
        eq(Ban.issuedToUserId, body.userId),
        and(isNull(Ban.revokedAt), or(isNull(Ban.liftAt), future(Ban.liftAt)))
      )}
      limit 1
    )
  `
      )
      .then((bans) => !!bans[0]?.exists);
  } catch (err) {
    throw await apiError(err, "Verifying the user to impersonate's ban status", route);
  }

  if (isBanned) {
    error(403, 'The user you want to impersonate is banned');
  }

  let userExists!: boolean;

  try {
    userExists = await db
      .execute(sql`select exists (select 1 from ${User} where ${eq(User.id, body.userId)} limit 1)`)
      .then((users) => !!users[0]?.exists);
  } catch (err) {
    throw await apiError(err, "Verifying the user to impersonate's ban status", route);
  }

  if (!userExists) {
    error(404, "The user you want to impersonate doesn't exist");
  }

  try {
    await db
      .update(Session)
      .set({
        expired: true
      })
      .where(eq(Session.id, session.sessionId));
  } catch (err) {
    throw await apiError(err, 'Expiring the current session', route);
  }

  let user!: Pick<typeof User.$inferSelect, 'admin' | 'approvedHost'> & {
    discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
    osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username'>;
  };

  try {
    user = await db
      .select({
        ...pick(User, ['admin', 'approvedHost']),
        discord: pick(DiscordUser, ['discordUserId', 'username']),
        osu: pick(OsuUser, ['osuUserId', 'username'])
      })
      .from(User)
      .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
      .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
      .where(eq(User.id, body.userId))
      .limit(1)
      .then((users) => users[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the user to impersonate', route);
  }

  const newSession = await createSession(body.userId, getClientAddress(), userAgent, route);

  const authSession: AuthSession = {
    sessionId: newSession.id,
    userId: body.userId,
    admin: user.admin,
    approvedHost: user.approvedHost,
    // Essentially sets it so the user data never updates
    updatedApiDataAt: 16725225600000,
    discord: {
      id: user.discord.discordUserId,
      username: user.discord.username
    },
    osu: {
      id: user.osu.osuUserId,
      username: user.osu.username
    },
    realUser: session.realUser || {
      id: session.userId,
      discordUserId: session.discord.id,
      osuUserId: session.osu.id
    }
  };

  cookies.set('session', signJWT(authSession), {
    path: '/'
  });

  return new Response('Successfully impersonated user');
}) satisfies RequestHandler;

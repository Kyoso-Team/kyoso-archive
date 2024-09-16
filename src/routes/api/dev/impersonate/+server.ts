import { error } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import * as v from 'valibot';
import { Ban, DiscordUser, OsuUser, Session, User } from '$db';
import { createSession } from '$lib/server/auth';
import { getSession } from '$lib/server/context';
import { env } from '$lib/server/env';
import { catcher } from '$lib/server/error';
import { recordExists } from '$lib/server/queries';
import { parseRequestBody } from '$lib/server/request';
import { db } from '$lib/server/services';
import { isNullOrFuture } from '$lib/server/sql';
import { apiError, pick, signJWT } from '$lib/server/utils';
import { positiveIntSchema } from '$lib/validation';
import type { AuthSession } from '$lib/types';
import type { RequestHandler } from './$types';

export const PUT = (async ({ cookies, route, getClientAddress, request }) => {
  if (env.NODE_ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession('api', cookies, true);
  const userAgent = request.headers.get('User-Agent');
  const body = await parseRequestBody(
    'api',
    request,
    v.object({
      userId: positiveIntSchema
    })
  );

  if (!userAgent) {
    error(400, '"User-Agent" header is undefined');
  }

  const isBanned = await recordExists(
    Ban,
    and(eq(Ban.issuedToUserId, body.userId), and(isNull(Ban.revokedAt), isNullOrFuture(Ban.liftAt)))
  ).catch(catcher('api', "Verifying the user to impersonate's ban status"));

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

  const newSession = await createSession('api', body.userId, getClientAddress(), userAgent);

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

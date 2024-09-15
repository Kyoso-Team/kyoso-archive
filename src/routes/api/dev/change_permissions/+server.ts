import * as v from 'valibot';
import { env } from '$lib/server/env';
import { error } from '@sveltejs/kit';
import { getSession, parseRequestBody } from '$lib/server/helpers/api';
import { User } from '$db';
import { eq } from 'drizzle-orm';
import { apiError, signJWT } from '$lib/server/utils';
import { redis, db } from '$lib/server/services';
import type { RequestHandler } from './$types';
import type { AuthSession } from '$types';

export const PATCH = (async ({ cookies, route, request }) => {
  if (env.NODE_ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession(cookies, true);
  const { owner, admin, approvedHost } = await parseRequestBody(
    request,
    v.object({
      owner: v.boolean(),
      admin: v.boolean(),
      approvedHost: v.boolean()
    }),
    route
  );

  if (owner !== undefined) {
    const p = redis.pipeline();
    p.set(`owner:${session.userId}`, owner ? 'true' : 'false');
    p.persist(`owner:${session.userId}`);
    await p.exec();
  }

  try {
    await db
      .update(User)
      .set({
        admin,
        approvedHost
      })
      .where(eq(User.id, session.userId));
  } catch (err) {
    throw await apiError(err, 'Updating the user', route);
  }

  const authSession: AuthSession = {
    ...session,
    admin: admin ?? session.admin,
    approvedHost: approvedHost ?? session.approvedHost
  };

  cookies.set('session', signJWT(authSession), {
    path: '/'
  });

  return new Response('Successfully updated user');
}) satisfies RequestHandler;

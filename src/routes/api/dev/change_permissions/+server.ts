import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { User } from '$db';
import { getSession } from '$lib/server/context';
import { env } from '$lib/server/env';
import { parseRequestBody } from '$lib/server/request';
import { db, redis } from '$lib/server/services';
import { apiError, signJWT } from '$lib/server/utils';
import type { AuthSession } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH = (async ({ cookies, route, request }) => {
  if (env.NODE_ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession('api', cookies, true);
  const { owner, admin, approvedHost } = await parseRequestBody(
    'api',
    request,
    v.object({
      owner: v.boolean(),
      admin: v.boolean(),
      approvedHost: v.boolean()
    })
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

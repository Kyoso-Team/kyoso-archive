import env from '$lib/server/env';
import { Notification, db } from '$db';
import { getSession } from '$lib/server/helpers/api';
import { and, count, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies);
  const isDevEnv = env.ENV === 'development';
  const unreadNotificationCount = session ? (
    db
      .select({ count: count(Notification.id).as('count') })
      .from(Notification)
      .where(and(eq(Notification.userId, session.userId), eq(Notification.read, false)))
      .then((rows) => rows[0].count)
  ) : new Promise<number>((resolve) => resolve(0));

  return {
    session,
    isDevEnv,
    streamed: {
      unreadNotificationCount
    }
  };
}) satisfies LayoutServerLoad;

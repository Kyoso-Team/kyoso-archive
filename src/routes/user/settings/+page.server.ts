import { and, desc, eq, not } from 'drizzle-orm';
import platform from 'platform';
import { Session, User } from '$db';
import { getSession } from '$lib/server/context';
import { catcher } from '$lib/server/error';
import { db } from '$lib/server/services';
import { pick } from '$lib/server/utils';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, depends }) => {
  depends('reload:user_settings');
  const session = getSession('page', cookies, true);

  const user = await db
    .select(pick(User, ['apiKey', 'settings']))
    .from(User)
    .where(eq(User.id, session.userId))
    .limit(1)
    .then((rows) => rows[0])
    .catch(catcher('page', 'Getting the user'));

  const activeSessions = await db
    .select(
      pick(Session, ['id', 'createdAt', 'ipAddress', 'userAgent', 'lastActiveAt', 'ipMetadata'])
    )
    .from(Session)
    .where(and(eq(Session.userId, session.userId), not(Session.expired)))
    .orderBy(desc(Session.lastActiveAt))
    .catch(catcher('page', 'Getting the active sessions'));

  const sessions = activeSessions.map(
    ({ id, createdAt, ipAddress, userAgent, lastActiveAt, ipMetadata }) => {
      const { os, name, version } = platform.parse(userAgent);

      return {
        id,
        createdAt,
        ipAddress,
        userAgent,
        lastActiveAt,
        ipMetadata,
        browser: {
          name,
          version
        },
        os: {
          name: os?.family,
          version: os?.version
        }
      };
    }
  );

  return {
    session,
    user,
    activeSessions: sessions
  };
}) satisfies PageServerLoad;

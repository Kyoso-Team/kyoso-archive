import platform from 'platform';
import { Session, User, db } from '$db';
import { apiError, pick } from '$lib/server/utils';
import { and, desc, eq, not } from 'drizzle-orm';
import { getSession } from '$lib/server/helpers/api';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, route }) => {
  const session = getSession(cookies, true);

  let user!: Pick<typeof User.$inferSelect, 'apiKey'>;

  try {
    user = await db
      .select(pick(User, ['apiKey']))
      .from(User)
      .where(eq(User.id, session.userId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the user', route);
  }

  let activeSessions!: Pick<
    typeof Session.$inferSelect,
    'id' | 'createdAt' | 'ipAddress' | 'userAgent' | 'lastActiveAt' | 'ipMetadata'
  >[];

  try {
    activeSessions = await db
      .select(
        pick(Session, ['id', 'createdAt', 'ipAddress', 'userAgent', 'lastActiveAt', 'ipMetadata'])
      )
      .from(Session)
      .where(and(eq(Session.userId, session.userId), not(Session.expired)))
      .orderBy(desc(Session.lastActiveAt));
  } catch (err) {
    throw await apiError(err, 'Getting the active sessions', route);
  }

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

import { User, db } from '$db';
import { getSession, sveltekitError, pick } from '$lib/server-utils';
import { eq } from 'drizzle-orm';
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
    throw await sveltekitError(err, 'Getting the user', route);
  }

  return { user };
}) satisfies PageServerLoad;

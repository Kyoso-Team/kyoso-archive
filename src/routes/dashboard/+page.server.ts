import db from '$db';
import { dbUser } from '$db/schema';
import { eq } from 'drizzle-orm';
import { getStoredUser, findFirstOrThrow } from '$lib/server-utils';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  let storedUser = getStoredUser(event, true);

  let user = findFirstOrThrow(
    await db
      .select({
        freeServicesLeft: dbUser.freeServicesLeft
      })
      .from(dbUser)
      .where(eq(dbUser.id, storedUser.id)),
    'user'
  );

  return {
    user
  };
}) satisfies PageServerLoad;

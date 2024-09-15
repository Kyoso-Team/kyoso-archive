import { db } from '$lib/server/services';
import { Session } from '$db';
import { validateCronSecret } from '$lib/server/helpers/api';
import { apiError } from '$lib/server/utils';
import { and, eq, lte, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const DELETE = (async ({ request, route }) => {
  validateCronSecret(request);

  try {
    await db
      .delete(Session)
      .where(
        and(eq(Session.expired, true), lte(Session.createdAt, sql`now() - interval '7 days'`))
      );
  } catch (err) {
    throw await apiError(err, 'Deleting sessions', route);
  }

  return new Response('Successfully deleted expired sessions older than 7 days');
}) satisfies RequestHandler;

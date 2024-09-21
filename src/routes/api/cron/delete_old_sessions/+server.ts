import { and, eq, lte, sql } from 'drizzle-orm';
import { Session } from '$db';
import { catcher } from '$lib/server/error';
import { validateCronSecret } from '$lib/server/request';
import { db } from '$lib/server/services';
import type { RequestHandler } from './$types';

export const DELETE = (async ({ request }) => {
  validateCronSecret('api', request);

  await db
    .delete(Session)
    .where(and(eq(Session.expired, true), lte(Session.createdAt, sql`now() - interval '7 days'`)))
    .catch(catcher('api', 'Deleting sessions'));

  return new Response('Successfully deleted expired sessions older than 7 days');
}) satisfies RequestHandler;

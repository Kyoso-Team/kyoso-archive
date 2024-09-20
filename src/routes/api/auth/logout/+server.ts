import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { Session } from '$db';
import { getSession } from '$lib/server/context';
import { catcher } from '$lib/server/error';
import { db } from '$lib/server/services';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const session = getSession('trpc', cookies, true);
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;

  await db
    .update(Session)
    .set({
      expired: true
    })
    .where(eq(Session.id, session.sessionId))
    .catch(catcher('api', 'Expiring the session'));

  cookies.delete('session', {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

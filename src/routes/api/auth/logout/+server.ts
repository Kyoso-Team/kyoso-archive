import { redirect } from '@sveltejs/kit';
import { apiError } from '$lib/server/utils';
import { db } from '$lib/server/services';
import { Session } from '$db';
import { eq } from 'drizzle-orm';
import { getSession } from '$lib/server/helpers/api';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies, route }) => {
  const session = getSession(cookies, true);
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;

  try {
    await db
      .update(Session)
      .set({
        expired: true
      })
      .where(eq(Session.id, session.sessionId));
  } catch (err) {
    throw await apiError(err, 'Expiring the session', route);
  }

  cookies.delete('session', {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

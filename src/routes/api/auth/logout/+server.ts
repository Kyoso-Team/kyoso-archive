import { redirect } from '@sveltejs/kit';
import { getSession, sveltekitError } from '$lib/server-utils';
import { Session, db } from '$db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies, route }) => {
  const session = getSession(cookies, true);
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;

  try {
    await db
      .delete(Session)
      .where(eq(Session.id, session.sessionId));
  } catch (err) {
    throw await sveltekitError(err, 'Getting the Discord OAuth token', route);
  }

  cookies.delete('session', {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

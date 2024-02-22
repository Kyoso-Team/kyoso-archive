import env from '$lib/env/server';
import { createContext } from '$trpc/context';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { logError, sveltekitError, verifyJWT } from '$lib/server-utils';
import { redirect, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { Session, db } from '$db';
import { and, eq, sql } from 'drizzle-orm';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { AuthSession } from '$types';

const trpcHandle = createTRPCHandle({
  router,
  createContext,
  onError: async ({ error, path }) => {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      await logError(error.cause, error.message.split('when: ')[1], `trpc.${path}`);
    }
  }
});

async function verifySession({ cookies, route }: RequestEvent): Promise<AuthSession | undefined> {
  const sessionCookie = cookies.get('session');

  if (route.id?.includes('/api/auth')) return;

  if (!sessionCookie) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    return;
  }

  const session = verifyJWT<AuthSession>(sessionCookie);
  let sessionIsActive = false;

  try {
    sessionIsActive = await db
      .update(Session)
      .set({
        lastActiveAt: sql`now()`
      })
      .where(and(
        eq(Session.id, session?.sessionId || 0),
        eq(Session.expired, false)
      ))
      .returning({
        exists: sql`1`.as('exists')
      })
      .then((sessions) => !!sessions[0]?.exists);
  } catch (err) {
    throw await sveltekitError(err, 'Verifying the session', route);
  }

  if (session && sessionIsActive) return session;

  cookies.delete('temp_osu_profile', {
    path: '/'
  });

  cookies.delete('session', {
    path: '/'
  });
}

const mainHandle: Handle = async ({ event, resolve }) => {
  const { url } = event;
  const session = await verifySession(event);

  if (env.ENV === 'testing') {
    const isTester = session?.admin || env.TESTERS.includes(session?.osu.id || 0);

    if (url.pathname !== '/testers-auth' && !url.pathname.includes('/api/auth') && !session) {
      if (!session) {
        redirect(302, '/testers-auth');
      } else if (!isTester) {
        error(401, 'You are not a tester for Kyoso');
      }
    } else if (url.pathname === '/testers-auth' && isTester) {
      redirect(302, '/');
    }
  }

  return await resolve(event);
};

export const handle = sequence(trpcHandle, mainHandle);

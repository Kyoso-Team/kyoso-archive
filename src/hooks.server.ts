import env from '$lib/env/server';
import { createContext } from '$trpc/context';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { getSession, logError, sveltekitError, verifyJWT } from '$lib/server-utils';
import { redirect, type Handle, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { AuthSession } from '$types';
import { Session, db } from '$db';
import { and, eq, sql } from 'drizzle-orm';

const trpcHandle = createTRPCHandle({
  router,
  createContext,
  onError: async ({ error, path }) => {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      await logError(error.cause, error.message.split('when: ')[1], `trpc.${path}`);
    }
  }
});

const sessionHandle: Handle = async ({ event, resolve }) => {
  const { cookies, route } = event;
  const sessionCookie = cookies.get('session');

  if (route.id?.includes('/api/auth')) {
    return await resolve(event);
  }

  if (!sessionCookie) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    return await resolve(event);
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

  if (!session || !sessionIsActive) {
    cookies.delete('temp_osu_profile', {
      path: '/'
    });

    cookies.delete('session', {
      path: '/'
    });
  }

  return await resolve(event);
};

const mainHandle: Handle = async ({ event, resolve }) => {
  const { url, cookies } = event;
  const session = getSession(cookies);

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

export const handle = sequence(trpcHandle, sessionHandle, mainHandle);

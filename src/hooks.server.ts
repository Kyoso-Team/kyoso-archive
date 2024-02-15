import env from '$lib/env/server';
import { createContext } from '$trpc/context';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { getSession, logError } from '$lib/server-utils';
import { redirect, type Handle, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const trpcHandle = createTRPCHandle({
  router,
  createContext,
  onError: async ({ error, path }) => {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      await logError(error.cause, error.message.split('when: ')[1], `trpc.${path}`);
    }
  }
});

const mainHandle: Handle = async ({ event, resolve }) => {
  const { url, cookies } = event;
  const session = getSession(cookies);

  if (env.ENV === 'testing') {
    const isTester = session?.isAdmin || env.TESTERS.includes(session?.osu.id || 0);

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

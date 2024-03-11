import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ request, cookies, fetch, url }: RequestEvent) {
  const sessionCookie = (request.headers.get('cookie') || '');

  if (sessionCookie.match(/session/g)?.length || 0 > 1) {
    cookies.delete('session', {
      path: '/trpc'
    });
  }

  return {
    request,
    fetch,
    url,
    cookies: {
      session: sessionCookie
        .split(';')
        .map((subStr) => subStr.split('=')[1])
        .find((value) => value !== '')
    }
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

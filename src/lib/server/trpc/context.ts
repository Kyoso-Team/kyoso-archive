import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ request, cookies, fetch, url }: RequestEvent) {
  cookies.delete('session', {
    path: '/trpc'
  });

  return {
    request,
    fetch,
    url,
    cookies: {
      session: (request.headers.get('cookie') || '')
        .split(';')
        .map((subStr) => subStr.split('=')[1])
        .find((value) => value !== '')
    }
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ request, cookies, fetch, url }: RequestEvent) {
  return {
    request,
    cookies,
    fetch,
    url
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

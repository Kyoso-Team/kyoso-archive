import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({
  request,
  cookies,
  fetch,
  url,
  getClientAddress
}: RequestEvent) {
  return {
    request,
    fetch,
    url,
    cookies,
    getClientAddress
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

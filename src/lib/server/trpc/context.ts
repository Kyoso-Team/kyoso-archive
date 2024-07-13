import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ cookies, getClientAddress }: RequestEvent) {
  return {
    sessionCookie: cookies.get('session'),
    getClientAddress
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

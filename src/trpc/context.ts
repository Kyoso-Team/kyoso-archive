import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ request, cookies }: RequestEvent) {
  return {
    request,
    cookies
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

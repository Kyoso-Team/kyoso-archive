import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ cookies }: RequestEvent) {
  return { cookies };
}

export type Context = inferAsyncReturnType<typeof createContext>;

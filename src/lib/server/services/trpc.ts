import superjson from 'superjson';
import { env } from '$lib/server/env';
import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '$types';
import type { RequestEvent } from '@sveltejs/kit';

export async function createTRPCContext({
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

export const trpc = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  isDev: env.NODE_ENV === 'development'
});

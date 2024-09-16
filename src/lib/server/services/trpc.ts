import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { env } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';
import type { TRPCContext } from '$lib/types';

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

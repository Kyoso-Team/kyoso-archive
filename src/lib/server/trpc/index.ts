import superjson from 'superjson';
import { env } from '$lib/server/env';
import { initTRPC } from '@trpc/server';
import type { Context } from '$trpc/context';

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  isDev: env.NODE_ENV === 'development'
});

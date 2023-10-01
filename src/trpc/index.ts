import superjson from 'superjson';
import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import type { Context } from '$trpc/context';

export const t = initTRPC.context<Context>().create({
  transformer: superjson
});

export async function tryCatch<T>(cb: () => Promise<T> | T, messageOnError: string) {
  try {
    return await cb();
  } catch (cause) {
    console.error(cause);

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: messageOnError,
      cause
    });
  }
}
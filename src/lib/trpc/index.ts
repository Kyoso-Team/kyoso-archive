import { initTRPC } from '@trpc/server';
import type { Context } from '$trpc/context';
import { TRPCError } from '@trpc/server';

export const t = initTRPC.context<Context>().create();

export async function tryCatch<T>(cb: () => Promise<T> | T, messageOnError: string) {
  try {
    return await cb();
  } catch (cause) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: messageOnError,
      cause
    });
  }
}

import { initTRPC } from '@trpc/server';

export function trpc<T extends Record<string, string | number | boolean>>() {
  return initTRPC.context<T>().create();
}

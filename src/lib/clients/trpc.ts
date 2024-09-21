import superjson from 'superjson';
import { createTRPCClient } from 'trpc-sveltekit';
import type { TRPCClientInit } from 'trpc-sveltekit';
import type { TRPCRouter } from '$lib/types';

let browserClient: ReturnType<typeof createTRPCClient<TRPCRouter>>;

export function trpc(init?: TRPCClientInit) {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && browserClient) {
    return browserClient;
  }

  const client = createTRPCClient<TRPCRouter>({
    init,
    transformer: superjson
  });

  if (isBrowser) {
    browserClient = client;
  }

  return client;
}
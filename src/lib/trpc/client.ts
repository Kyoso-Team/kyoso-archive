import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';
import type { Router } from '$trpc/router';

let browserClient: ReturnType<typeof createTRPCClient<Router>>;

export function trpc(init?: TRPCClientInit) {
  let isBrowser = typeof window !== 'undefined';

  if (isBrowser && browserClient) {
    return browserClient;
  }

  let client = createTRPCClient<Router>({ init });

  if (isBrowser) {
    browserClient = client;
  }

  return client;
}

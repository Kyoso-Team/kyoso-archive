import { createContext } from '$trpc/context';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { logError } from '$lib/server-utils';

export const handle = createTRPCHandle({
  router,
  createContext,
  onError: async ({ error, path }) => {
    await logError(error.cause, error.message, `trpc.${path}`);
  }
});
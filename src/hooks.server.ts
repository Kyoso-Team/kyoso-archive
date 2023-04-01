import { createContext } from '$trpc/context';
import { router } from '$trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';

export const handle = createTRPCHandle({ router, createContext });

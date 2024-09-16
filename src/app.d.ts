import type { TRPCRouterOutputs } from '$lib/types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface PageState {
      adminUsersPage?: {
        lookedUpUser?: TRPCRouterOutputs['users']['getUser'];
      };
    }
  }
}

export {};

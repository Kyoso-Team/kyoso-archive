import type { TRPCRouterIO } from '$types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface PageState {
      adminUsersPage?: {
        lookedUpUser?: TRPCRouterIO['users']['getUser'];
      };
    }
  }
}

export {};

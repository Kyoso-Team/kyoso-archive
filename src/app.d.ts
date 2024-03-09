import type { TRPCRouter } from '$types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface PageState {
      adminUsersPage?: {
        lookedUpUser?: TRPCRouter['users']['getUser'];
      };
    }
  }
}

export {};

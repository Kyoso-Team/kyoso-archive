import { writable } from 'svelte/store';
import type { AuthSession } from '$types';

export const showNavBar = writable(true);
export const loading = writable(false);

export const devMenuCtx = writable<
  | {
      session: AuthSession | undefined;
      isUserOwner: boolean;
    }
  | undefined
>(undefined);

export * from './form';
export * from './functionQueue';

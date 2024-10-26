import { writable } from 'svelte/store';
import type { StaffPermission } from '$db';
import type { AuthSession, InferEnum } from '$lib/types';

export const showNavBar = writable(true);
export const loading = writable(false);

export const devMenuCtx = writable<
  | {
      session: AuthSession | undefined;
      isUserOwner: boolean;
      tournament?: {
        id: number;
      };
      staffMember?: {
        id: number;
        permissions: InferEnum<typeof StaffPermission>[];
      };
    }
  | undefined
>(undefined);

export * from './form';
export * from './functionQueue';
export * from './toast';

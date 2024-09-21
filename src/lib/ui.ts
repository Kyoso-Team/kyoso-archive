import { TRPCClientError } from '@trpc/client';
import { loading } from '$lib/stores';
import { toastError } from './utils';
import type { ToastStore } from '@skeletonlabs/skeleton';

/**
 * @throws {Error}
 */
export function displayError(toast: ToastStore, err: unknown): never {
  loading.set(false);

  if (err instanceof TRPCClientError) {
    toastError(toast, err.message);
  } else if (typeof err === 'object' && 'message' in (err || {})) {
    toastError(toast, (err as any).message);
  } else {
    toastError(toast, 'An unknown error ocurred');
  }

  throw err;
}

export function catcher(toast: ToastStore) {
  /**
   * @throws {Error}
   */
  return (err: unknown) => displayError(toast, err);
}

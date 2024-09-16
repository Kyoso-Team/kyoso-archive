import { catcher, displayError } from '$lib/utils';
import type { Asset } from '$lib/types';
import type { ToastStore } from '@skeletonlabs/skeleton';

export function createUploadClient<T extends Asset<any, any>>(toast: ToastStore, endpoint: string) {
  async function put(body: T['put']) {
    const fd = new FormData();

    for (const key in body) {
      fd.append(key, body[key]);
    }

    const resp = await fetch(endpoint, {
      method: 'PUT',
      body: fd
    }).catch(catcher(toast));

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }
  }

  async function delete_(body: T['delete']) {
    const fd = new FormData();

    for (const key in body) {
      fd.append(key, body[key]);
    }

    const resp = await fetch(endpoint, {
      method: 'DELETE',
      body: fd
    }).catch(catcher(toast));

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }
  }

  return {
    delete: delete_,
    put
  };
}

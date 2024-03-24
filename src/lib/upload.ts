import { loading } from '$stores';
import { displayError } from './utils';
import type { Asset } from '$types';
import type { ToastStore } from '@skeletonlabs/skeleton';

export function createUploadClient<T extends Asset<any, any>>(toast: ToastStore, endpoint: string) {
  async function put(body: T['put']) {
    let resp!: Response;
    const fd = new FormData();
    loading.set(true);

    for (const key in body) {
      fd.append(key, body[key]);
    }

    try {
      resp = await fetch(endpoint, {
        method: 'PUT',
        body: fd
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }

    loading.set(false);
  }

  async function delete_(body: T['delete']) {
    let resp!: Response;
    const fd = new FormData();
    loading.set(true);

    for (const key in body) {
      fd.append(key, body[key]);
    }

    try {
      resp = await fetch(endpoint, {
        method: 'PUT',
        body: fd
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }

    loading.set(false);
  }

  return {
    delete: delete_,
    put
  };
}
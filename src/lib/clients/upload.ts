import { toast } from '$lib/stores';
import type { Asset } from '$lib/types';

export function createUploadClient<T extends Asset<any, any>>(endpoint: string) {
  async function put(body: T['put']) {
    const fd = new FormData();

    for (const key in body) {
      fd.append(key, body[key]);
    }

    const resp = await fetch(endpoint, {
      method: 'PUT',
      body: fd
    }).catch(toast.errorCatcher);

    if (!resp.ok) {
      toast.error(await resp.text());
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
    }).catch(toast.errorCatcher);

    if (!resp.ok) {
      toast.error(await resp.text());
    }
  }

  return {
    delete: delete_,
    put
  };
}

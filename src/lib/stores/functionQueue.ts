import { writable } from 'svelte/store';
import type { MaybePromise } from '@sveltejs/kit';

export function createFunctionQueue() {
  const { subscribe, set } = writable<[...(() => MaybePromise<void | 'next'>)[], () => MaybePromise<void>] | undefined>();

  function createQueue(fns: [...(() => MaybePromise<void | 'next'>)[], () => MaybePromise<void>]) {
    set(fns);
  }

  async function nextFunction(queue: [...(() => MaybePromise<void | 'next'>)[], () => MaybePromise<void>] | undefined) {
    if (!queue) return;
    const value = await queue[0]();

    if (value === 'next') {
      nextFunction([... queue.slice(1)] as any);
      return;
    }

    set([... queue.slice(1)] as any);
  }

  function clearQueue() {
    set(undefined);
  }

  return {
    subscribe,
    createQueue,
    nextFunction,
    clearQueue
  };
}

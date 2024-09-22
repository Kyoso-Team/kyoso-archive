import { writable } from 'svelte/store';
import type { ToastItem } from '$lib/types';

export function createToast() {
  const maxNotificationsOnScreen = 3;
  const timerLength = 3000;

  const toast = writable<{
    items: Map<string, ToastItem>;
    paused: Set<string>;
    queued: Set<string>;
    showing: Set<string>;
    timers: Map<string, NodeJS.Timer>;
  }>({
    items: new Map(),
    paused: new Set(),
    queued: new Set(),
    showing: new Set(),
    timers: new Map()
  });

  function add(item: ToastItem) {
    toast.update((toast) => {
      const id = Math.random().toString(36).substring(2, 8);
      toast.items.set(id, item);

      if (toast.showing.size + 1 > maxNotificationsOnScreen) {
        toast.queued.add(id);
      } else {
        toast.showing.add(id);
        toast.timers.set(
          id,
          setTimeout(() => removeShowingItem(id), timerLength)
        );
      }

      return Object.assign({}, toast);
    });
  }

  function pause(id: string) {
    toast.update((toast) => {
      const showing = [...toast.showing];
      const afterCurrent = showing.slice(showing.indexOf(id));

      for (const item of afterCurrent) {
        toast.paused.add(item);
        clearTimeout(toast.timers.get(item)!);
        toast.timers.delete(item);
      }

      return Object.assign({}, toast);
    });
  }

  function resume() {
    toast.update((toast) => {
      const paused = [...toast.paused];

      for (let i = 0; i < paused.length; i++) {
        toast.timers.set(
          paused[i],
          setTimeout(() => removeShowingItem(paused[i]), timerLength + 150 * i)
        );
      }

      toast.paused = new Set();
      return Object.assign({}, toast);
    });
  }

  function removeShowingItem(id: string) {
    toast.update((toast) => {
      toast.showing.delete(id);
      toast.items.delete(id);
      toast.timers.delete(id);

      if (toast.queued.size > 0) {
        const nextId = [...toast.queued][0];
        toast.queued.delete(nextId);
        toast.showing.add(nextId);
        toast.timers.set(
          nextId,
          setTimeout(() => removeShowingItem(nextId), timerLength)
        );
      }

      return Object.assign({}, toast);
    });
  }

  function success(message: string) {
    add({ message, type: 'success' });
  }

  function error(message: string) {
    add({ message, type: 'error' });
  }

  function important(message: string, linkTo?: string) {
    add({ message, linkTo, type: 'important' });
  }

  function notification(message: string, linkTo?: string) {
    add({ message, linkTo, type: 'notification' });
  }

  return {
    ...toast,
    success,
    error,
    important,
    notification,
    pause,
    resume
  };
}

export const toast = createToast();

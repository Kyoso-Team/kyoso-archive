import { writable } from 'svelte/store';
import type { AnyComponent } from '$types';

function createSidebar() {
  const { subscribe, set } = writable<
    | {
        component: AnyComponent;
        columns: 1 | 2;
      }
    | undefined
  >();

  function create(component: AnyComponent, columns: 1 | 2) {
    set({ component, columns });
  }

  function destroy() {
    set(undefined);
  }

  return {
    subscribe,
    create,
    destroy
  };
}

export const sidebar = createSidebar();

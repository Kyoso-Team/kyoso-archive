import { writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function createSidebar() {
  const { subscribe, set } = writable<{
    component: Any;
    columns: 1 | 2;
  } | undefined>();

  function create(component: Any, columns: 1 | 2) {
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

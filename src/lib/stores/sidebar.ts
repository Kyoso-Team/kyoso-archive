import { writable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function createSidebar() {
  const { subscribe, set } = writable<Any | undefined>();

  function create(component: Any) {
    set(component);
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

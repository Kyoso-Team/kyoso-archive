import { get, writable } from 'svelte/store';

export function createToggle(initial: boolean) {
  const state = writable(initial);

  function toggle() {
    state.set(!get(state));
  }

  function false$() {
    state.set(false);
  }

  function true$() {
    state.set(true);
  }

  return {
    ...state,
    toggle,
    false$,
    true$
  };
}

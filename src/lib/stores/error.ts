import { writable } from 'svelte/store';

function createError() {
  const { subscribe, set } = writable<string | undefined>();

  function formatObject(obj: Record<string, unknown> | object, nestingLevel = 1) {
    let formatted = '{';

    Object.entries(obj).forEach(([key, value]) => {
      let formattedValue = '';

      if (value === undefined) {
        formattedValue = 'undefined';
      } else if (value === null) {
        formattedValue = 'null';
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        formattedValue = value.toString();
      } else if (typeof value === 'object') {
        formattedValue = formatObject(value, nestingLevel + 1);
      } else {
        formattedValue = `'${value}'`;
      }

      formatted += `\n${' '.repeat(nestingLevel * 2)}${key}: ${formattedValue}`;
    });

    formatted += `\n${' '.repeat((nestingLevel - 1) * 2)}}`;
    return formatted;
  }

  function setError(err: unknown, currentError?: string) {
    if (currentError) return;

    let error = err as Record<string, unknown> | string;
    set(typeof error === 'string' ? error : formatObject(error));
  }

  function removeError() {
    set(undefined);
  }

  return {
    subscribe,
    set: setError,
    destroy: removeError
  };
}

export const error = createError();

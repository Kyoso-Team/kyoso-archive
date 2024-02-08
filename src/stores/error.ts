// import { writable } from 'svelte/store';

// interface Error {
//   message: string;
//   type: 'string' | 'object';
//   action: 'refresh' | 'close';
//   canSubmitIssue: boolean;
//   onClose?: () => void | Promise<void>;
// }

// function createError() {
//   const { subscribe, set } = writable<Error | undefined>();

//   function formatObject(obj: Record<string, unknown> | object, nestingLevel = 1) {
//     let formatted = '{';

//     Object.entries(obj).forEach(([key, value]) => {
//       let formattedValue = '';

//       if (value === undefined) {
//         formattedValue = 'undefined';
//       } else if (value === null) {
//         formattedValue = 'null';
//       } else if (typeof value === 'boolean') {
//         formattedValue = value ? 'true' : 'false';
//       } else if (typeof value === 'number') {
//         formattedValue = value.toString();
//       } else if (typeof value === 'object') {
//         formattedValue = formatObject(value, nestingLevel + 1);
//       } else {
//         formattedValue = `"${value}"`;
//       }

//       formatted += `\n${' '.repeat(nestingLevel * 2)}${key}: ${formattedValue}`;
//     });

//     formatted += `\n${' '.repeat((nestingLevel - 1) * 2)}}`;
//     return formatted;
//   }

//   function setError(
//     currentError: Error | undefined,
//     err: unknown,
//     action: 'refresh' | 'close',
//     canSubmitIssue: boolean = true,
//     onClose?: () => void | Promise<void>
//   ) {
//     if (currentError) return;

//     let error = err as Record<string, unknown> | string;
//     set({
//       message: typeof error === 'string' ? error : formatObject(error),
//       type: typeof error === 'string' ? 'string' : 'object',
//       canSubmitIssue,
//       action,
//       onClose
//     });
//   }

//   function removeError() {
//     set(undefined);
//   }

//   return {
//     subscribe,
//     set: setError,
//     destroy: removeError
//   };
// }

// export const error = createError();

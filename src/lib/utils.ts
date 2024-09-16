//import colors from 'tailwindcss/colors';
import { TRPCClientError } from '@trpc/client';
import { loading } from '$lib/stores';
import type { ToastStore } from '@skeletonlabs/skeleton';
import type { StaffPermission } from '$db';
import type { InferEnum, PaginationSettings, PopupSettings } from '$lib/types';

/**
 * Tailwind's default colors as a record
 */
// export const twColors = colors as unknown as Record<
//   string,
//   Record<string, 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900>
// >;

/**
 * ```plain
 * Example (full): new Date('2023-08-20T20:07:11.768Z') => 'August 20th, 2023'
 * Example (shortened): new Date('2023-08-20T20:07:11.768Z') => 'Aug 20th, 2023'
 * ```
 */
export function formatDate(date: Date, month: 'full' | 'shortened' = 'full') {
  const months =
    month === 'shortened'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ];

  const dateStr = date.getDate().toString();
  let cardinal: string = '';

  if (dateStr.at(-2) !== '1') {
    if (dateStr.endsWith('1')) {
      cardinal = 'st';
    } else if (dateStr.endsWith('2')) {
      cardinal = 'nd';
    } else if (dateStr.endsWith('3')) {
      cardinal = 'rd';
    } else {
      cardinal = 'th';
    }
  } else {
    cardinal = 'th';
  }

  return `${months[date.getMonth()]} ${dateStr}${cardinal}, ${date.getFullYear()}`;
}

/**
 * ```plain
 * Example: new Date('2023-08-20T20:07:11.768Z') => '8:07 PM'
 * ```
 */
export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const period = hours < 12 ? 'AM' : 'PM';

  return `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
}

/**
 * ```plain
 * Example: n = 25, digitCount = 5 => '00025'
 * ```
 */
export function formatDigits(n: number, digitCount: number) {
  const nStr = n.toString();
  const missingDigits = digitCount - nStr.length;
  let str = '';

  for (let i = missingDigits; i > 0; i--) {
    str += '0';
  }

  return `${str}${nStr}`;
}

/**
 * ```plain
 * Example: 1000 => '1,000'
 * ```
 */
export function formatNumber(n: number) {
  return new Intl.NumberFormat('us-US').format(n);
}

/**
 * Transform a numerical value in a different byte unit
 */
export const convertBytes = {
  kb: (value: number) => value * 1_000,
  mb: (value: number) => value * 1_000_000
};

/**
 * Create a tooltip object
 */
export function tooltip(
  target: string,
  placement: PopupSettings['placement'] = 'top'
): PopupSettings {
  return {
    target,
    placement,
    event: 'focus-hover'
  };
}

/**
 * Trims the string type values in each property of an object
 */
export function trimStringValues<T extends Record<string, unknown>>(obj: T): T {
  const newObj: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      newObj[key] = value;
      return;
    }

    newObj[key] = value.trim();
  });

  return newObj as T;
}

export function fillDateDigits(n: number) {
  return n < 10 ? `0${n}` : n.toString();
}

/**
 * Parses a Date type value and transforms it into a valid string for an HTML input of type datetime-local
 * ```plain
 * Example: new Date('2023-08-20T20:07:11.768Z') => '2023-08-20T20:07:11'
 * Example (only date): new Date('2023-08-20T20:07:11.768Z') => '2023-08-20'
 * ```
 */
export function dateToHtmlInput(date: Date, onlyDate?: boolean) {
  const year = date.getFullYear();
  const month = fillDateDigits(date.getMonth() + 1);
  const day = fillDateDigits(date.getDate());

  if (onlyDate) {
    return `${year}-${month}-${day}`;
  }

  const hour = fillDateDigits(date.getHours());
  const minute = fillDateDigits(date.getMinutes());
  const second = fillDateDigits(date.getSeconds());

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Type safe alternative to Object.keys
 */
export function keys<T extends Record<string, any>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any;
}

/**
 * Does the inputted staff member have the required permissions?
 */
export function hasPermissions(
  staffMember: { permissions: InferEnum<typeof StaffPermission>[] } | undefined,
  requiredPerms: InferEnum<typeof StaffPermission>[]
) {
  return staffMember ? staffMember.permissions.some((perm) => requiredPerms.includes(perm)) : false;
}

/**
 * Sort an array of objects based on a given key
 */
export function sortByKey<T extends Record<string, any>>(
  arr: T[],
  key: keyof T,
  direction: 'asc' | 'desc'
): T[] {
  return arr.sort((obj1, obj2) => {
    const a = obj1[key];
    const b = obj2[key];

    if (a === b) {
      return 0;
    }

    if (direction === 'asc') {
      return a < b ? -1 : 1;
    } else {
      return a > b ? -1 : 1;
    }
  });
}

/**
 * Do the two arrays have the same elements? Regardless of other
 */
export function arraysHaveSameElements<T>(arr1: T[], arr2: T[]) {
  return arr1.length === arr2.length && arr1.every((val) => arr2.includes(val));
}

/**
 * Apply a certain Tailwind color based off of a mod acronym
 */
// export function colorByMod(
//   mod: Mod | 'nm' | 'fm' | 'tb',
//   value: ParseInt<keyof (typeof colors)['neutral']>
// ) {
//   let color: Record<keyof (typeof colors)['neutral'], string> | undefined;

//   switch (mod) {
//     case 'dt':
//       color = colors.violet;
//       break;
//     case 'ez':
//       color = colors.green;
//       break;
//     case 'fl':
//       color = colors.zinc;
//       break;
//     case 'fm':
//       color = colors.fuchsia;
//       break;
//     case 'hd':
//       color = colors.yellow;
//       break;
//     case 'hr':
//       color = colors.red;
//       break;
//     case 'ht':
//       color = colors.rose;
//       break;
//     case 'nm':
//       color = colors.blue;
//       break;
//     case 'pf':
//       color = colors.emerald;
//       break;
//     case 'rx':
//       color = colors.cyan;
//       break;
//     case 'sd':
//       color = colors.indigo;
//       break;
//     case 'tb':
//       color = colors.orange;
//       break;
//     default:
//       color = colors.neutral;
//       break;
//   }

//   return color[value];
// }

export function toastSuccess(toast: ToastStore, message: string) {
  toast.trigger({
    message,
    background: 'bg-success-500/10',
    classes:
      'relative border-l-4 border-success-500 text-white before:bg-surface-900 before:w-full before:h-full before:absolute before:inset-0 before:-z-[1] before:rounded-md',
    hideDismiss: true,
    timeout: 3000
  });
}

export function toastError(toast: ToastStore, message: string) {
  toast.trigger({
    message,
    background: 'bg-error-500/10',
    classes:
      'relative border-l-4 border-error-500 text-white before:bg-surface-900 before:w-full before:h-full before:absolute before:inset-0 before:-z-[1] before:rounded-md',
    hideDismiss: true,
    hoverable: true,
    timeout: 3000
  });
}

export function catcher(toast: ToastStore) {
  /**
   * @throws {Error}
   */
  return (err: unknown) => displayError(toast, err);
}

/**
 * @throws {Error}
 */
export function displayError(toast: ToastStore, err: unknown): never {
  loading.set(false);

  if (err instanceof TRPCClientError) {
    toastError(toast, err.message);
  } else if (typeof err === 'object' && 'message' in (err || {})) {
    toastError(toast, (err as any).message);
  } else {
    toastError(toast, 'An unknown error ocurred');
  }

  throw err;
}

export function isDatePast(date: Date | number | null) {
  if (!date) return false;
  return new Date(date).getTime() <= new Date().getTime();
}

export function isDateFuture(date: Date | number | null) {
  if (!date) return false;
  return new Date(date).getTime() > new Date().getTime();
}

export function paginate(page: number, elementsPerPage: number): PaginationSettings {
  return {
    offset: elementsPerPage * (page - 1),
    limit: elementsPerPage
  };
}

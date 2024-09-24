import type { StaffPermission } from '$db';
import type { InferEnum, PaginationSettings, PopupSettings } from '$lib/types';

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

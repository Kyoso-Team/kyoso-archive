import type { StaffPermission } from '@prisma/client';
import type { PopupSettings } from '@skeletonlabs/skeleton';
import type { SafeParseReturnType } from 'zod';

export const format = {
  rank: (n: number) => `#${new Intl.NumberFormat('us-US').format(n)}`,
  price: (n: number) => {
    return new Intl.NumberFormat('us-US', {
      style: 'currency',
      currency: 'USD'
    }).format(n);
  },
  date: (date: Date, month: 'full' | 'shortened' = 'full') => {
    let months =
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

    let dateStr = date.getDate().toString();
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
    }

    return `${months[date.getMonth()]} ${dateStr}${cardinal}, ${date.getFullYear()}`;
  }
};

export function removeDuplicates<T>(arr: T[]) {
  return [...new Set(arr)];
}

export function setSettingError<T extends string | number | null | undefined | Date>(
  parsed: SafeParseReturnType<T, T>
) {
  return !parsed.success ? parsed.error.issues[0].message : undefined;
}

export function tooltip(target: string): PopupSettings {
  return {
    target,
    event: 'hover',
    placement: 'top'
  };
}

export function trimStringValues<T extends Record<string, unknown>>(obj: T): T {
  let newObj: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      newObj[key] = value;
      return;
    }

    newObj[key] = value.trim();
  });

  return newObj as T;
}

function fillDateDigits(n: number) {
  return n < 10 ? `0${n}` : n.toString();
}

export function dateToHtmlInput(date: Date) {
  let year = date.getFullYear();
  let month = fillDateDigits(date.getMonth() + 1);
  let day = fillDateDigits(date.getDate());

  let hour = fillDateDigits(date.getHours());
  let minute = fillDateDigits(date.getMinutes());
  let second = fillDateDigits(date.getSeconds());

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function hasPerms(
  staffMember: {
    roles: {
      permissions: StaffPermission[];
    }[];
  },
  necessaryPermissions: StaffPermission[] | StaffPermission
) {
  let userPermissions: StaffPermission[] = [];

  staffMember.roles.forEach((role) => {
    userPermissions.push(...role.permissions);
  });

  userPermissions = removeDuplicates(userPermissions);

  return Array.isArray(necessaryPermissions)
    ? userPermissions.some((userPerm) => necessaryPermissions.includes(userPerm))
    : userPermissions.some((userPerm) => necessaryPermissions === userPerm);
}

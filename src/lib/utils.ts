import colors from 'tailwindcss/colors';
import { modalStore } from '@skeletonlabs/skeleton';
import type { Mod, StaffPermission } from '@prisma/client';
import type { PopupSettings } from '@skeletonlabs/skeleton';
import type { SafeParseReturnType } from 'zod';
import type { PageStore, ParseInt } from '$types';

export const twColors = colors as unknown as Record<
  string,
  Record<string, 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900>
>;

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
  },
  digits: (n: number, digitCount: number) => {
    let nStr = n.toString();
    let missingDigits = digitCount - nStr.length;
    let str = '';

    for (let i = missingDigits; i > 0; i--) {
      str += '0';
    }

    return `${str}${nStr}`;
  },
  listArray: (arr: (string | number)[]) => {
    let str = '';

    if (arr.length > 1) {
      str += `${arr[0]}`;

      for (let i = 1; i < arr.length - 1; i++) {
        str += `, ${arr[i]}`;
      }

      str += ` & ${arr[arr.length - 1]}`;
    }

    return str;
  },
  cardinal: (n: number) => {
    let str = n.toString();

    if (['1', '2', '3'].find((n) => n === str.at(-1)) && str.at(-2) !== '1') {
      switch (str.at(-1)) {
        default:
          return `${n}th`;
        case '1':
          return `${n}st`;
        case '2':
          return `${n}nd`;
        case '3':
          return `${n}rd`;
      }
    }

    return `${n}th`;
  },
  placements: (placements: number[]) => {
    let str = '';

    if (placements.length === 1) {
      str = format.cardinal(placements[0]);
    } else if (placements.length === 2) {
      str = `${format.cardinal(placements[0])} & ${format.cardinal(placements[1])}`;
    } else {
      str = `${format.cardinal(placements[0])}-${format.cardinal(placements.at(-1) || 0)}`;
    }

    return str;
  }
};

export const calc = {
  bwsRank: (rank: number, badgeCount: number) => {
    return rank ** (0.9937 ** (badgeCount ** 2));
  }
};

export const modal = {
  yesNo: (
    title: string,
    message: string,
    onYes: () => void | Promise<void>,
    onNo?: () => void | Promise<void>
  ) => {
    modalStore.trigger({
      title,
      type: 'confirm',
      buttonTextCancel: 'No',
      buttonTextConfirm: 'Yes',
      body: message,
      response: (resp: boolean) => {
        if (resp) {
          onYes();
          return;
        }

        if (onNo) {
          onNo();
        }
      }
    });
  }
};

export const buildLink = {
  forumPost: (forumPostId: number) => `https://osu.ppy.sh/community/forums/topics/${forumPostId}`,
  discord: (discordInviteId: string) => `https://discord.gg/${discordInviteId}`,
  spreadsheet: (spreadsheetId: string) => `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  twitch: (twitchChannelName: string) => `https://www.twitch.tv/${twitchChannelName}`,
  youtube: (youtubeChannelId: string) => `https://www.youtube.com/channel/${youtubeChannelId}`,
  twitter: (twitterHandle: string) => `https://twitter.com/${twitterHandle}`
};

export const byteUnit = {
  kb: (value: number) => value * 1_000,
  mb: (value: number) => value * 1_000_000
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
  } | null,
  necessaryPermissions: StaffPermission[] | StaffPermission
) {
  if (!staffMember) {
    return false;
  }

  let userPermissions: StaffPermission[] = [];

  staffMember.roles.forEach((role) => {
    userPermissions.push(...role.permissions);
  });

  userPermissions = removeDuplicates(userPermissions);

  return Array.isArray(necessaryPermissions)
    ? userPermissions.some((userPerm) => necessaryPermissions.includes(userPerm))
    : userPermissions.some((userPerm) => necessaryPermissions === userPerm);
}

export function getFileUrl(page: PageStore, path: string) {
  return `${page.url.origin}/uploads/${path}`;
}

export function colorByMod(
  mod: Mod | 'NM' | 'FM' | 'TB',
  value: ParseInt<keyof (typeof colors)['neutral']>
) {
  let color: Record<keyof (typeof colors)['neutral'], string> | undefined;

  switch (mod) {
    case 'DT':
      color = colors.violet;
      break;
    case 'EZ':
      color = colors.green;
      break;
    case 'FL':
      color = colors.zinc;
      break;
    case 'FM':
      color = colors.fuchsia;
      break;
    case 'HD':
      color = colors.yellow;
      break;
    case 'HR':
      color = colors.red;
      break;
    case 'HT':
      color = colors.rose;
      break;
    case 'NM':
      color = colors.blue;
      break;
    case 'PF':
      color = colors.emerald;
      break;
    case 'RX':
      color = colors.cyan;
      break;
    case 'SD':
      color = colors.indigo;
      break;
    case 'TB':
      color = colors.orange;
      break;
    default:
      color = colors.neutral;
      break;
  }

  return color[value];
}

export function hasTournamentConcluded(tournament: { concludesOn: Date | null }) {
  return !!tournament.concludesOn && tournament.concludesOn.getTime() > new Date().getTime();
}

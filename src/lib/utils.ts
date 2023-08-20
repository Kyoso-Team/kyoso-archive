import colors from 'tailwindcss/colors';
import { modalStore } from '@skeletonlabs/skeleton';
import type { PopupSettings } from '@skeletonlabs/skeleton';
import type { SafeParseReturnType } from 'zod';
import type { PageStore, ParseInt, Mod, StaffPermission } from '$types';

/**
 * Tailwind's default colors as a record
 */
export const twColors = colors as unknown as Record<
  string,
  Record<string, 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900>
>;

/**
 * Format numbers
 */
export const format = {
  /**
   * Example: 81000 => '#81,000'
   */
  rank: (n: number) => `#${new Intl.NumberFormat('us-US').format(n)}`,
  /**
   * Example: 5 => '$5.00'
   */
  price: (n: number) => {
    return new Intl.NumberFormat('us-US', {
      style: 'currency',
      currency: 'USD'
    }).format(n);
  },
  /**
   * Example (full): new Date('2023-08-20T20:07:11.768Z') => 'August 20th, 2023'
   * Example: (shortened): new Date('2023-08-20T20:07:11.768Z') => 'Aug 20th, 2023'
   */
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
  /**
   * Example (with 5 digits): 25 => '00025'
   */
  digits: (n: number, digitCount: number) => {
    let nStr = n.toString();
    let missingDigits = digitCount - nStr.length;
    let str = '';

    for (let i = missingDigits; i > 0; i--) {
      str += '0';
    }

    return `${str}${nStr}`;
  },
  /**
   * Example: ['Mario564', 'Taevas', 'Rekunan'] => 'Mario564, Taevas & Rekunan'
   */
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
  /**
   * Example: 1 => '1st'
   */
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
  /**
   * Examples:
   * - [1] => '1st'
   * - [2,3] => '2nd & 3rd'
   * - [4,6] => '4th-6th'
   */
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

/**
 * Calculate certain values
 */
export const calc = {
  /**
   * Calculate a user's BWS rank
   */
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

/**
 * Builds tournament related links
 */
export const buildLink = {
  forumPost: (forumPostId: number) => `https://osu.ppy.sh/community/forums/topics/${forumPostId}`,
  discord: (discordInviteId: string) => `https://discord.gg/${discordInviteId}`,
  spreadsheet: (spreadsheetId: string) => `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  twitch: (twitchChannelName: string) => `https://www.twitch.tv/${twitchChannelName}`,
  youtube: (youtubeChannelId: string) => `https://www.youtube.com/channel/${youtubeChannelId}`,
  twitter: (twitterHandle: string) => `https://twitter.com/${twitterHandle}`
};

/**
 * Transform a numerical value in a different byte unit
 */
export const byteUnit = {
  kb: (value: number) => value * 1_000,
  mb: (value: number) => value * 1_000_000
};

/**
 * Returns an error message if the Zod schema didn't successfully parse the input  
 */
export function setSettingError<T extends string | number | null | undefined | Date>(
  parsed: SafeParseReturnType<T, T>
) {
  return !parsed.success ? parsed.error.issues[0].message : undefined;
}

/**
 * Create a tooltip object
 */
export function tooltip(target: string): PopupSettings {
  return {
    target,
    event: 'hover',
    placement: 'top'
  };
}

/**
 * Trims the string type values in each property of an object
 */
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

/**
 * Parses a Date type value and transforms it into a valid string for an HTML input of type datetime-local
 */
export function dateToHtmlInput(date: Date) {
  let year = date.getFullYear();
  let month = fillDateDigits(date.getMonth() + 1);
  let day = fillDateDigits(date.getDate());

  let hour = fillDateDigits(date.getHours());
  let minute = fillDateDigits(date.getMinutes());
  let second = fillDateDigits(date.getSeconds());

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Does a staff member meet certain permissions?
 */
export function hasPerms(
  staffMember: {
    roles: {
      permissions: StaffPermission[];
    }[];
  } | undefined,
  necessaryPermissions: StaffPermission[] | StaffPermission
) {
  if (!staffMember) {
    return false;
  }

  let userPermissions: StaffPermission[] = [];

  staffMember.roles.forEach((role) => {
    userPermissions.push(...role.permissions);
  });
  
  userPermissions = [...new Set(userPermissions)];

  return Array.isArray(necessaryPermissions)
    ? userPermissions.some((userPerm) => necessaryPermissions.includes(userPerm))
    : userPermissions.some((userPerm) => necessaryPermissions === userPerm);
}

/**
 * Get the full URL a user uploaded file
 */
export function getFileUrl(page: PageStore, path: string) {
  return `${page.url.origin}/uploads/${path}`;
}

/**
 * Apply a certain Tailwind color based off of a mod acronym
 */
export function colorByMod(
  mod: Mod | 'nm' | 'fm' | 'tb',
  value: ParseInt<keyof (typeof colors)['neutral']>
) {
  let color: Record<keyof (typeof colors)['neutral'], string> | undefined;

  switch (mod) {
    case 'dt':
      color = colors.violet;
      break;
    case 'ez':
      color = colors.green;
      break;
    case 'fl':
      color = colors.zinc;
      break;
    case 'fm':
      color = colors.fuchsia;
      break;
    case 'hd':
      color = colors.yellow;
      break;
    case 'hr':
      color = colors.red;
      break;
    case 'ht':
      color = colors.rose;
      break;
    case 'nm':
      color = colors.blue;
      break;
    case 'pf':
      color = colors.emerald;
      break;
    case 'rx':
      color = colors.cyan;
      break;
    case 'sd':
      color = colors.indigo;
      break;
    case 'tb':
      color = colors.orange;
      break;
    default:
      color = colors.neutral;
      break;
  }

  return color[value];
}

/**
 * Has the tournament concluded?
 */
export function hasTournamentConcluded(tournament: { concludesOn: Date | null }) {
  return !!tournament.concludesOn && tournament.concludesOn.getTime() > new Date().getTime();
}

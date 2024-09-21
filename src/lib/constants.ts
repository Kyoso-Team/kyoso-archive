export const lower32BitIntLimit = -2147483648;
export const upper32BitIntLimit = 4294967296;

/** GMT: Saturday, February 24, 2024 12:00:00 AM */
export const oldestDatePossible = new Date(1708732800000);
/** GMT: Wednesday, Janaury 1st, 3000 12:00:00 PM */
export const maxPossibleDate = new Date(32503680000000);

export const notificationLinkTypes = [
  'dashboard',
  'user',
  'manage_tournament',
  'tournament',
  'manage_round_mappool',
  'manage_round_schedule',
  'manage_round_stats',
  'round_mappool',
  'round_schedule',
  'round_stats',
  'manage_form',
  'manage_staff_roles',
  'manage_staff_members',
  'manage_registrations',
  'manage_registration'
] as const;

export const notificationLinkTypesEnum = Object.fromEntries(
  notificationLinkTypes.map((type) => [type, type])
) as { [K in (typeof notificationLinkTypes)[number]]: K };

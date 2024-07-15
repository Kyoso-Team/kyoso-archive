import * as v from 'valibot';
import { arraysHaveSameElements } from './utils';
import type { Tournament, TournamentDates } from '$db';
import type { ModMultiplier, TournamentLink, UserFormField } from '$types';

export function parseEnv<T extends v.BaseSchema>(schema: T, env: unknown) {
  const parsed = v.safeParse(schema, env);

  if (!parsed.success) {
    const issues = v.flatten(parsed.issues).nested;

    for (const key in issues) {
      const split = key.split('.');
      console.error(
        `Env. variable "${split[0]}"${split[1] ? ` (at index ${split[1]})` : ''} must ${issues[key]}`
      );
    }

    throw new Error('Invalid environment variables');
  }

  return parsed.output;
}

export function tournamentChecks({
  type,
  teamSettings,
  rankRange
}: {
  type: typeof Tournament.$inferSelect['type'];
  teamSettings?: { minTeamSize: number; maxTeamSize: number } | null;
  rankRange?: { lower: number; upper?: number | null } | null;
}): string | undefined {
  if (type !== 'solo' && !teamSettings) {
    return 'Team settings are required for team-based tournaments';
  }

  if (type === 'solo' && teamSettings) {
    return 'Team settings can\'t be set for solo tournaments';
  }

  if (teamSettings && teamSettings.minTeamSize > teamSettings.maxTeamSize) {
    return 'The minimum team size must be less than or equal to the maximum';
  }

  if (rankRange && rankRange.upper && rankRange.lower > rankRange.upper) {
    return 'The lower rank range limit must be less than or equal to the maximum';
  }
}

export function tournamentDatesChecks(
  newDates: Partial<Record<
    Exclude<keyof typeof TournamentDates.$inferSelect, 'other' | 'tournamentId'>,
    Date | null
  >>,
  setDates: Partial<Record<
    Exclude<keyof typeof TournamentDates.$inferSelect, 'other' | 'tournamentId'>,
    Date | null
  >>
): string | undefined {
  const publishedAtTime = (setDates.publishedAt ?? newDates.publishedAt)?.getTime();
  const concludesAtTime = (setDates.concludesAt ?? newDates.concludesAt)?.getTime();
  const playerRegsOpenAtTime = (setDates.playerRegsOpenAt ?? newDates.playerRegsOpenAt)?.getTime();
  const playerRegsCloseAtTime = (setDates.playerRegsCloseAt ?? newDates.playerRegsCloseAt)?.getTime();
  const staffRegsOpenAtTime = (setDates.staffRegsOpenAt ?? newDates.staffRegsOpenAt)?.getTime();
  const staffRegsCloseAtTime = (setDates.staffRegsCloseAt ?? newDates.staffRegsCloseAt)?.getTime();
  const map = new Map<
    number,
    {
      newDate: Date | undefined | null;
      label: string;
      before?: (number | undefined)[];
      after?: (number | undefined)[];
    }
  >([
    [
      publishedAtTime ?? -1,
      {
        label: 'publish date',
        newDate: newDates.publishedAt,
        before: [
          concludesAtTime,
          playerRegsOpenAtTime,
          playerRegsCloseAtTime,
          staffRegsOpenAtTime,
          staffRegsCloseAtTime
        ]
      }
    ],
    [
      playerRegsOpenAtTime ?? -2,
      {
        label: 'player regs. opening date',
        newDate: newDates.playerRegsOpenAt,
        before: [playerRegsCloseAtTime, concludesAtTime],
        after: [publishedAtTime]
      }
    ],
    [
      playerRegsCloseAtTime ?? -3,
      {
        label: 'player regs. closing date',
        newDate: newDates.playerRegsCloseAt,
        before: [concludesAtTime],
        after: [publishedAtTime, playerRegsOpenAtTime]
      }
    ],
    [
      staffRegsOpenAtTime ?? -4,
      {
        label: 'staff regs. opening date',
        newDate: newDates.staffRegsOpenAt,
        before: [staffRegsCloseAtTime, concludesAtTime],
        after: [publishedAtTime]
      }
    ],
    [
      staffRegsCloseAtTime ?? -5,
      {
        label: 'staff regs. closing date',
        newDate: newDates.staffRegsCloseAt,
        before: [concludesAtTime],
        after: [publishedAtTime, staffRegsOpenAtTime]
      }
    ],
    [
      concludesAtTime ?? -6,
      {
        label: 'conclusion date',
        newDate: newDates.concludesAt,
        after: [
          publishedAtTime,
          playerRegsOpenAtTime,
          playerRegsCloseAtTime,
          staffRegsOpenAtTime,
          staffRegsCloseAtTime
        ]
      }
    ]
  ]);

  for (const [_, { newDate, label, after, before }] of map) {
    const beforeDates = before || [];
    const afterDates = after || [];

    if (newDate) {
      const time = newDate.getTime();

      for (const value of beforeDates) {
        if (value && time >= value) {
          return `The tournament's ${label} must be set to be before the ${map.get(value)?.label}`;
        }
      }

      for (const value of afterDates) {
        if (value && time <= value) {
          return `The tournament's ${label} must be set to be after the ${map.get(value)?.label}`;
        }
      }
    }
  }
}

function compareValues(a: any, b: any) {
  return a === b;
}

function compareArrays(a: any[], b: any[]) {
  return arraysHaveSameElements(a, b);
}

function identifyDuplicates<T extends Record<string, any>>(items: T[], current: T, by: keyof T, compareExisting?: boolean) {
  const labels = items.map((item) => item[by]);
  const compare = Array.isArray(current[by]) ? compareArrays : compareValues;
  return compareExisting
    ? items.some((item, i) => compare(item[by], current[by]) && i !== labels.indexOf(current[by]))
    : items.some((item) => compare(item[by], current[by]));
}

export function tournamentOtherDatesChecks(
  dates: (typeof TournamentDates.$inferSelect)['other']
): string | undefined {
  for (let i = 0; i < dates.length; i++) {
    const err = tournamentOtherDateChecks(dates, dates[i], true);
    if (err) return `${err} (at index ${i})`;
  }
}

export function tournamentOtherDateChecks(
  allOtherDates: (typeof TournamentDates.$inferSelect)['other'],
  date: (typeof TournamentDates.$inferSelect)['other'][number],
  compareExisting?: boolean
): string | undefined {
  if (date.toDate && date.fromDate > date.toDate) {
    return 'The starting date must be less than or equal to the maximum';
  }

  if (identifyDuplicates(allOtherDates, date, 'label', compareExisting)) {
    return `Date labeled "${date.label}" already exists in this tournament`;
  }
}

export function tournamentLinksChecks(links: TournamentLink[]) {
  for (let i = 0; i < links.length; i++) {
    const err = tournamentLinkChecks(links, links[i], true);
    if (err) return `${err} (at index ${i})`;
  }
}

export function tournamentLinkChecks(allLinks: TournamentLink[], link: TournamentLink, compareExisting?: boolean) {
  if (identifyDuplicates(allLinks, link, 'label', compareExisting)) {
    return `Link labeled "${link.label}" already exists in this tournament`;
  }
}

export function modMultipliersChecks(modMultipliers: ModMultiplier[]) {
  for (let i = 0; i < modMultipliers.length; i++) {
    const err = modMultiplierChecks(modMultipliers, modMultipliers[i], true);
    if (err) return `${err} (at index ${i})`;
  }
}

export function modMultiplierChecks(
  allModMultipliers: ModMultiplier[],
  modMultiplier: ModMultiplier,
  compareExisting?: boolean
) {
  const { mods } = modMultiplier as Extract<ModMultiplier, { multiplier: Record<string, any> }>;
  if (
    (mods.includes('ez') && mods.includes('hr')) ||
    (mods.includes('sd') && mods.includes('pf')) ||
    (mods.includes('fl') && mods.includes('bl'))
  ) {
    return 'The mod combination is invalid';
  }

  if (
    typeof modMultiplier.multiplier !== 'number' &&
    modMultiplier.multiplier.ifFailed >= modMultiplier.multiplier.ifSuccessful
  ) {
    return 'The multiplier in case of failure must be less than the multiplier in case of success';
  }

  if (mods.length !== new Set(mods).size) {
    return 'The mod combination contains duplicate mods';
  }

  if (identifyDuplicates(allModMultipliers, modMultiplier, 'mods', compareExisting)) {
    return `Mod multiplier with the mod combination ${modMultiplier.mods.join('').toUpperCase()} already exists in this tournament`;
  }
}

export function userFormFieldsChecks(fields: UserFormField[]) {
  for (let i = 0; i < fields.length; i++) {
    const err = userFormFieldChecks(fields, fields[i], true);
    if (err) return `${err} (at index ${i})`;
  }
}

export function userFormFieldChecks(allFields: UserFormField[], field: UserFormField, compareExisting?: boolean) {
  const { type } = field;

  if (
    type === 'short-text' ||
    type === 'long-text' ||
    ((type === 'number' || type === 'select-multiple' || type === 'datetime') &&
      (field.validation === 'between' || field.validation === 'not-between'))
  ) {
    if (field.min && field.max && field.min > field.max) {
      return 'The minimum must be less than or equal to the maximum';
    }
  }

  if (identifyDuplicates(allFields, field, 'id', compareExisting)) {
    return `Field with ID "${field.id}" already exists in this form`;
  }
}

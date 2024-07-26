import { arraysHaveSameElements } from './utils';

import type { TournamentDates } from '$db';
import type { ModMultiplier, TournamentLink, UserFormField } from '$types';
import type { FormUpdateSchemaData } from '$lib/server/procedures';

export function tournamentChecks({
  teamSettings,
  rankRange
}: {
  teamSettings?: { minTeamSize: number; maxTeamSize: number } | null;
  rankRange?: { lower: number; upper?: number | null } | null;
}): string | undefined {
  if (teamSettings && teamSettings.minTeamSize > teamSettings.maxTeamSize) {
    return 'The minimum team size must be less than or equal to the maximum';
  }

  if (rankRange && rankRange.upper && rankRange.lower > rankRange.upper) {
    return 'The lower rank range limit must be less than or equal to the maximum';
  }
}

export function tournamentDatesChecks(
  newDates: Record<
    Exclude<keyof typeof TournamentDates.$inferSelect, 'other' | 'tournamentId'>,
    Date | null | undefined
  >,
  setDates: Record<
    Exclude<keyof typeof TournamentDates.$inferSelect, 'other' | 'tournamentId'>,
    Date | null | undefined
  >
): string | undefined {
  const publishedAtTime = setDates.publishedAt?.getTime();
  const concludesAtTime = setDates.concludesAt?.getTime();
  const playerRegsOpenAtTime = setDates.playerRegsOpenAt?.getTime();
  const playerRegsCloseAtTime = setDates.playerRegsCloseAt?.getTime();
  const staffRegsOpenAtTime = setDates.staffRegsOpenAt?.getTime();
  const staffRegsCloseAtTime = setDates.staffRegsCloseAt?.getTime();
  const map = new Map<
    number | undefined,
    {
      newDate: Date | undefined | null;
      label: string;
      before?: (number | undefined)[];
      after?: (number | undefined)[];
    }
  >([
    [
      publishedAtTime,
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
      playerRegsOpenAtTime,
      {
        label: 'player regs. opening date',
        newDate: newDates.playerRegsOpenAt,
        before: [playerRegsCloseAtTime, concludesAtTime],
        after: [publishedAtTime]
      }
    ],
    [
      playerRegsCloseAtTime,
      {
        label: 'player regs. closing date',
        newDate: newDates.playerRegsCloseAt,
        before: [concludesAtTime],
        after: [publishedAtTime, playerRegsOpenAtTime]
      }
    ],
    [
      staffRegsOpenAtTime,
      {
        label: 'staff regs. opening date',
        newDate: newDates.staffRegsOpenAt,
        before: [staffRegsCloseAtTime, concludesAtTime],
        after: [publishedAtTime]
      }
    ],
    [
      staffRegsCloseAtTime,
      {
        label: 'staff regs. closing date',
        newDate: newDates.staffRegsCloseAt,
        before: [concludesAtTime],
        after: [publishedAtTime, staffRegsOpenAtTime]
      }
    ],
    [
      concludesAtTime,
      {
        label: 'conclusion date',
        newDate: newDates.concludesAt,
        after: [
          concludesAtTime,
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

export function tournamentOtherDatesChecks(
  dates: (typeof TournamentDates.$inferSelect)['other']
): string | undefined {
  for (let i = 0; i < dates.length; i++) {
    const err = tournamentOtherDateChecks(dates, dates[i]);
    if (err) return `${err} (at index ${i})`;
  }
}

export function tournamentOtherDateChecks(
  allOtherDates: (typeof TournamentDates.$inferSelect)['other'],
  date: (typeof TournamentDates.$inferSelect)['other'][number]
): string | undefined {
  if (date.toDate && date.fromDate > date.toDate) {
    return 'The starting date must be less than or equal to the maximum';
  }

  const allOtherDatesLabels = allOtherDates.map(({ label }) => label);
  if (
    allOtherDates.some(
      ({ label }, i) => label === date.label && i !== allOtherDatesLabels.indexOf(date.label)
    )
  ) {
    return `Date labeled "${date.label}" already exists in this tournament`;
  }
}

export function tournamentLinksChecks(links: TournamentLink[]) {
  for (let i = 0; i < links.length; i++) {
    const err = tournamentLinkChecks(links, links[i]);
    if (err) return `${err} (at index ${i})`;
  }
}

export function tournamentLinkChecks(allLinks: TournamentLink[], link: TournamentLink) {
  const allLinksLabels = allLinks.map(({ label }) => label);
  if (
    allLinks.some(({ label }, i) => label === link.label && i !== allLinksLabels.indexOf(label))
  ) {
    return `Link labeled "${link.label}" already exists in this tournament`;
  }
}

export function tournamentModMultipliersChecks(modMultipliers: ModMultiplier[]) {
  for (let i = 0; i < modMultipliers.length; i++) {
    const err = modMultiplierChecks(modMultipliers, modMultipliers[i]);
    if (err) return `${err} (at index ${i})`;
  }
}

export function modMultiplierChecks(
  allModMultipliers: ModMultiplier[],
  modMultiplier: ModMultiplier
) {
  const allModMultipliersMods = allModMultipliers.map(({ mods }) => mods.join(''));
  if (
    allModMultipliers.some(
      ({ mods }, i) =>
        arraysHaveSameElements(mods, modMultiplier.mods) &&
        i !== allModMultipliersMods.indexOf(modMultiplier.mods.join(''))
    )
  ) {
    return `Mod multiplier with the mod combination ${modMultiplier.mods.join('').toUpperCase()} already exists in this tournament`;
  }

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
}

export function userFormFieldsChecks(fields: UserFormField[]) {
  for (let i = 0; i < fields.length; i++) {
    const err = userFormFieldChecks(fields[i]);
    if (err) return `${err} (at index ${i})`;
  }
}

export function userFormFieldChecks(field: UserFormField) {
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
}

export function checkPublicForm(data: FormUpdateSchemaData): string | undefined {
  if (data.public === false) {
    return 'Public form cannot be unpublished';
  }

  if (data.anonymousResponses) {
    return 'Public form responses cannot be changed to anonymous';
  }
}

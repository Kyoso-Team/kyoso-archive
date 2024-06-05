import * as v from 'valibot';
import { maxPossibleDate, oldestDatePossible } from './constants';

// When writing the error messages for scehmas, keep in mind that the message will be formated like:
// "Invalid input: {object_name}.{property} should {message}"
// Example: "Invalid input: body.tournamentId should be a number"
// (The messages will not appear in tRPC procedures)

export const positiveIntSchema = v.number('be a number', [
  v.integer('be an integer'),
  v.minValue(1, 'be greater or equal to 1')
]);

export const fileIdSchema = v.string('be a string', [v.length(8, 'have 8 characters')]);

export const fileSchema = v.instance(File, 'be a file');

export const boolStringSchema = v.transform(
  v.union([v.literal('true'), v.literal('false')], 'be a boolean'),
  (input) => input === 'true'
);

export const urlSlugSchema = v.custom(
  (input: string) => /^[a-z0-9_]+$/g.test(input),
  'only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789_"'
);

export const draftTypeSchema = v.union(
  [v.literal('linear'), v.literal('snake')],
  'be "linear" or "snake"'
);

export const winConditionSchema = v.union(
  [v.literal('score'), v.literal('accuracy'), v.literal('combo')],
  'be "score", "accuracy" or "combo"'
);

export const tournamentLinkIconSchema = v.union(
  [
    v.literal('osu'),
    v.literal('discord'),
    v.literal('google_sheets'),
    v.literal('google_forms'),
    v.literal('twitch'),
    v.literal('youtube'),
    v.literal('x'),
    v.literal('challonge'),
    v.literal('donate'),
    v.literal('website')
  ],
  'be "osu", "discord", "google_sheets", "google_forms", "twitch", "youtube", "x", "challonge", "donate" or "website"'
);

// Schemas below this do not require error messages to be set

export const refereeSettingsSchema = v.object({
  timerLength: v.object({
    pick: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    ban: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    protect: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    ready: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    start: v.number([v.integer(), v.minValue(1), v.maxValue(600)])
  }),
  allow: v.object({
    doublePick: v.boolean(),
    doubleBan: v.boolean(),
    doubleProtect: v.boolean()
  }),
  order: v.object({
    ban: draftTypeSchema,
    pick: draftTypeSchema,
    protect: draftTypeSchema
  }),
  alwaysForceNoFail: v.boolean(),
  banAndProtectCancelOut: v.boolean(),
  winCondition: winConditionSchema
});

export const tournamentLinkSchema = v.object({
  label: v.string([v.minLength(2), v.maxLength(20)]),
  url: v.string([v.url()]),
  icon: tournamentLinkIconSchema
});

export const bwsValuesSchema = v.object({
  x: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)]),
  y: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)]),
  z: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)])
});

export const teamSettingsSchema = v.object({
  minTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  maxTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  useTeamBanners: v.boolean()
});

export const tournamentOtherDatesSchema = v.object({
  label: v.string([v.minLength(2), v.maxLength(35)]),
  onlyDate: v.boolean(),
  fromDate: v.number([v.minValue(oldestDatePossible.getTime()), v.maxValue(maxPossibleDate.getTime())]),
  toDate: v.nullable(v.number([v.minValue(oldestDatePossible.getTime()), v.maxValue(maxPossibleDate.getTime())]))
});

export const rankRangeSchema = v.object({
  lower: v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]),
  upper: v.optional(v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]))
});

export const modMultiplierSchema = v.union([
  v.object({
    /** Easy, Hidden, Hard Rock, Flashlight, Blinds */
    mods: v.union([
      v.literal('ez'),
      v.literal('hd'),
      v.literal('hr'),
      v.literal('fl'),
      v.literal('bl')
    ]),
    multiplier: v.number([v.integer(), v.minValue(-5), v.maxValue(5)])
  }),
  v.object({
    /** Sudden Death, Perfect */
    mods: v.union([
      v.literal('sd'),
      v.literal('pf')
    ]),
    multiplier: v.object({
      ifSuccessful: v.number([v.integer(), v.minValue(-5), v.maxValue(5)]),
      ifFailed: v.number([v.integer(), v.minValue(-5), v.maxValue(5)])
    })
  })
]);

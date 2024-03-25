import * as v from 'valibot';
import { oldestDatePossible } from './constants';

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
  'only containt the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789_"'
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

export const oldestPossibleDateMsSchema = v.number('be a number', [
  v.minValue(oldestDatePossible.getTime(), `be greater or equal to ${oldestDatePossible.getTime()}`)
]);

// Schemas below this do not require error messages to be set

export const refereeSettingsSchema = v.object({
  timerLength: v.object({
    pick: positiveIntSchema,
    ban: positiveIntSchema,
    protect: positiveIntSchema,
    ready: positiveIntSchema,
    start: positiveIntSchema
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
  label: v.string([v.minLength(1), v.maxLength(20)]),
  url: v.string([v.url()]),
  icon: tournamentLinkIconSchema
});

export const bwsValuesSchema = v.object({
  x: v.number(),
  y: v.number(),
  z: v.number()
});

export const teamSettingsSchema = v.object({
  minTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  maxTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  useTeamBanners: v.boolean()
});

export const tournamentOtherDatesSchema = v.object({
  label: v.string(),
  fromDate: v.number(),
  toDate: v.nullable(v.number())
});

export const rankRangeSchema = v.object({
  lower: v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]),
  upper: v.optional(v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]))
});

// export const whereIdSchema = z.object({
//   id: z.number().int()
// });

// export const sortSchema = z.union([z.literal('asc'), z.literal('desc')]);

// export const withTournamentSchema = z.object({
//   tournamentId: z.number().int()
// });

// export const withRoundSchema = withTournamentSchema.extend({
//   roundId: z.number().int()
// });

// export const mToN = z.object({
//   addIds: z.array(z.number().int()).optional().default([]),
//   removeIds: z.array(z.number().int()).optional().default([])
// });

// export const modSchema = z.union([
//   z.literal('ez'),
//   z.literal('hd'),
//   z.literal('hr'),
//   z.literal('sd'),
//   z.literal('dt'),
//   z.literal('rx'),
//   z.literal('ht'),
//   z.literal('fl'),
//   z.literal('pf')
// ]);

// export const skillsetSchema = z.union([
//   z.literal('consistency'),
//   z.literal('streams'),
//   z.literal('tech'),
//   z.literal('alt'),
//   z.literal('speed'),
//   z.literal('gimmick'),
//   z.literal('rhythm'),
//   z.literal('aim'),
//   z.literal('awkward_aim'),
//   z.literal('flow_aim'),
//   z.literal('reading'),
//   z.literal('precision'),
//   z.literal('stamina'),
//   z.literal('finger_control'),
//   z.literal('jack_of_all_trades')
// ]);

// export const availabilitySchema = z
//   .string()
//   .length(99)
//   .refine((str) => {
//     const regex = /(1|0){24}\.(1|0){24}\.(1|0){24}\.(1|0){24}/g;
//     return regex.test(str);
//   }, "Input doesn't match availability string format");

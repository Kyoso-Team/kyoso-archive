import * as v from 'valibot';

// When writing the error messages for schemas, keep in mind that the message will be formated like:
// "Invalid input: {object_name}.{property} should {message}"
// Example: "Invalid input: body.tournamentId should be a number"
// (The messages will not appear in tRPC procedures)

export const nonEmptyStringSchema = v.string('be a string', [
  v.minLength(1, 'have 1 character or more')
]);

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
  (input: string) => /^[a-z0-9-]+$/g.test(input),
  'only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789-"'
);

export const hexColorSchema = v.custom(
  (input: string) => /^[0-9a-fA-F]{6}$/i.test(input),
  'be a color in hexadecimal format'
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
    v.literal('google_docs'),
    v.literal('twitch'),
    v.literal('youtube'),
    v.literal('x'),
    v.literal('challonge'),
    v.literal('liquipedia'),
    v.literal('donation'),
    v.literal('website')
  ],
  'be "osu", "discord", "google_sheets", "google_forms", "google_docs", "twitch", "youtube", "x", "challonge", "liquipedia", "donation" or "website"'
);

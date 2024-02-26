import * as v from 'valibot';

// When writing the error messages for scehmas, keep in mind that the message will be formated like:
// "Invalid input: {object_name}.{property} should {message}"
// Example: "Invalid input: body.tournamentId should be a number"
// (The messages will not appear in tRPC procedures)

export const positiveIntSchema = v.number(
  'be a number',
  [v.integer('be an integer'), v.minValue(1, 'be greater or equal to 1')]
);

export const fileIdSchema = v.string(
  'be a string',
  [v.length(8, 'have 8 characters')]
);

export const fileSchema = v.instance(File, 'be a file');

export const boolStringSchema = v.transform(
  v.union(
    [v.literal('true'), v.literal('false')],
    'be a boolean'
  ),
  (input) => input === 'true'
);

export const urlSlugSchema = v.custom((input: string) => /[abcdefghijkmnlopqrstuvwxyz0123456789_]+$/.test(input));

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

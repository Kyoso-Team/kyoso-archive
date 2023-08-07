import { z } from 'zod';

export const whereIdSchema = z.object({
  id: z.number().int()
});

export const prismaSortSchema = z.union([z.literal('asc'), z.literal('desc')]);

export const withTournamentSchema = z.object({
  tournamentId: z.number().int()
});

export const withRoundSchema = withTournamentSchema.extend({
  roundId: z.number().int()
});

export const modSchema = z.union([
  z.literal('EZ'),
  z.literal('HD'),
  z.literal('HR'),
  z.literal('SD'),
  z.literal('DT'),
  z.literal('RX'),
  z.literal('HT'),
  z.literal('FL'),
  z.literal('PF')
]);

export const skillsetSchema = z.union([
  z.literal('Consistency'),
  z.literal('Streams'),
  z.literal('Tech'),
  z.literal('Alt'),
  z.literal('Speed'),
  z.literal('Gimmick'),
  z.literal('Rhythm'),
  z.literal('Aim'),
  z.literal('AwkwardAim'),
  z.literal('FlowAim'),
  z.literal('Reading'),
  z.literal('Precision'),
  z.literal('Stamina'),
  z.literal('FingerControl'),
  z.literal('JackOfAllTrades')
]);

export const availabilitySchema = z
  .string()
  .length(99)
  .refine((str) => {
    let regex = /(1|0){24}\.(1|0){24}\.(1|0){24}\.(1|0){24}/g;
    return regex.test(str);
  }, "Input doesn't match availability string format");

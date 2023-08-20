import { z } from 'zod';

export const whereIdSchema = z.object({
  id: z.number().int()
});

export const sortSchema = z.union([z.literal('asc'), z.literal('desc')]);

export const withTournamentSchema = z.object({
  tournamentId: z.number().int()
});

export const withRoundSchema = withTournamentSchema.extend({
  roundId: z.number().int()
});

export const mToN = z.object({
  addIds: z.array(z.number().int()).optional().default([]),
  removeIds: z.array(z.number().int()).optional().default([])
});

export const modSchema = z.union([
  z.literal('ez'),
  z.literal('hd'),
  z.literal('hr'),
  z.literal('sd'),
  z.literal('dt'),
  z.literal('rx'),
  z.literal('ht'),
  z.literal('fl'),
  z.literal('pf')
]);

export const skillsetSchema = z.union([
  z.literal('consistency'),
  z.literal('streams'),
  z.literal('tech'),
  z.literal('alt'),
  z.literal('speed'),
  z.literal('gimmick'),
  z.literal('rhythm'),
  z.literal('aim'),
  z.literal('awkward_aim'),
  z.literal('flow_aim'),
  z.literal('reading'),
  z.literal('precision'),
  z.literal('stamina'),
  z.literal('finger_control'),
  z.literal('jack_of_all_trades')
]);

export const availabilitySchema = z
  .string()
  .length(99)
  .refine((str) => {
    let regex = /(1|0){24}\.(1|0){24}\.(1|0){24}\.(1|0){24}/g;
    return regex.test(str);
  }, "Input doesn't match availability string format");

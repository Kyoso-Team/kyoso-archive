import { z } from 'zod';

export const whereIdSchema = z.object({
  id: z.number().int()
});

export const prismaSortSchema = z.union([z.literal('asc'), z.literal('desc')]);

export const withTournamentSchema = z.object({
  tournamentId: z.number().int()
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

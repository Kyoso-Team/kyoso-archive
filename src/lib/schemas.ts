import { z } from 'zod';

export const whereIdSchema = z.object({
  id: z.number().int()
});

export const prismaSortSchema = z.union([z.literal('asc'), z.literal('desc')]);

export const withTournamentSchema = z.object({
  tournamentId: z.number().int()
});

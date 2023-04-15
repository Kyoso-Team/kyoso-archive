import { z } from 'zod';

export const whereIdSchema = z.object({
  id: z.number().int()
});

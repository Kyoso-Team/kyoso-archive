import { z } from 'zod';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent, params }) => {
  let parentData = await parent();
  let tournamentId = z.number().int().parse(Number(params.tournamentId));

  return {
    ...parentData,
    tournamentId
  };
}) satisfies LayoutServerLoad;

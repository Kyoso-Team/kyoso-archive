import prisma from '$prisma';
import { z } from 'zod';
import { getStoredUser } from '$lib/server-utils';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  getStoredUser(event, true);
  let tournamentId = z.number().int().parse(Number(event.params.tournamentId));

  let tournament = await prisma.tournament.findFirstOrThrow({
    where: {
      id: tournamentId
    },
    select: {
      id: true,
      name: true
    }
  });

  return {
    tournament
  };
}) satisfies PageServerLoad;

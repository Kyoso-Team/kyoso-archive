import prisma from '$prisma';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent, params }) => {
  let data = await parent();
  let tournamentId = z.number().int().parse(Number(params.tournamentId));

  let tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId
    },
    select: {
      id: true,
      name: true,
      acronym: true,
      type: true,
      services: true
    }
  });

  if (!tournament) {
    throw error(404, `Couldn't find tournament with ID ${tournamentId}.`);
  }

  return {
    ...data,
    tournament
  };
}) satisfies LayoutServerLoad;

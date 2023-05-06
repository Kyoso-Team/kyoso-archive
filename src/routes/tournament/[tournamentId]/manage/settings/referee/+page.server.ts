import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournamentId } = await parent();

  let tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId
    },
    select: {
      startTimerLength: true,
      pickTimerLength: true,
      doublePickAllowed: true,
      doubleBanAllowed: true,
      rollRules: true,
      freeModRules: true,
      warmupRules: true,
      lateProcedures: true,
      banOrder: true
    }
  });

  return {
    id: tournamentId,
    ...tournament
  };
}) satisfies PageServerLoad;

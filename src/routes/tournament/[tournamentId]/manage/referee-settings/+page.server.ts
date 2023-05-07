import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
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
      banOrder: true,
      alwaysForceNoFail: true,
      winCondition: true
    }
  });

  return {
    id: data.tournament.id,
    ...tournament
  };
}) satisfies PageServerLoad;

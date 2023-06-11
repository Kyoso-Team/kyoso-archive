import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    throw error(401, `You lack the necessary permissions to manage the referee settings for tournament of ID ${data.tournament.id}.`);
  }

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

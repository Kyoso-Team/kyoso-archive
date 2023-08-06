import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the rules for tournament of ID ${data.tournament.id}.`
    );
  }

  let { rules } = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      rules: true
    }
  });

  return {
    id: data.tournament.id,
    rules
  };
}) satisfies PageServerLoad;

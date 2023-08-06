import prisma from '$prisma';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament', 'ViewStaffMembers'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the staff roles for tournament of ID ${data.tournament.id}.`
    );
  }

  let roles = await prisma.staffRole.findMany({
    where: {
      AND: [{
        tournamentId: data.tournament.id
      }, {
        name: {
          notIn: ['Host', 'Debugger']
        }
      }]
    },
    select: {
      id: true,
      name: true,
      order: true,
      permissions: true,
      color: true
    },
    orderBy: {
      order: 'asc'
    }
  });

  return {
    roles,
    tournament: {
      id: data.tournament.id,
      name: data.tournament.name,
      acronym: data.tournament.acronym
    }
  };
}) satisfies PageServerLoad;

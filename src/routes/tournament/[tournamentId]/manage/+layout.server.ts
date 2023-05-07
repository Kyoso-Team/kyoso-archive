import prisma from '$prisma';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournament, user } = await parent();

  if (!user) {
    throw error(401, 'You\'re not logged in.');
  }

  let staffMember = await prisma.staffMember.findUnique({
    where: {
      userId_tournamentId: {
        tournamentId: tournament.id,
        userId: user.id
      }
    },
    select: {
      id: true,
      roles: {
        select: {
          permissions: true
        }
      }
    }
  });

  if (!staffMember) {
    throw error(403, `You're not a staff member for tournament of ID ${tournament.id}.`);
  }

  return {
    tournament,
    staffMember
  };
}) satisfies LayoutServerLoad;

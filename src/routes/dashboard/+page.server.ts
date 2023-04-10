import prisma from '$prisma';
import { getStoredUser } from '$lib/server-utils';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  let storedUser = getStoredUser(event, true);

  let user = await prisma.user.findUniqueOrThrow({
    where: {
      id: storedUser.id
    },
    select: {
      freeServicesLeft: true
    }
  });

  return {
    user
  };
}) satisfies PageServerLoad;

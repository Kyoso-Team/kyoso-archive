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
      id: true,
      discordUserId: true,
      showDiscordTag: true,
      apiKey: true
    }
  });

  let purchases = await prisma.purchase.findMany({
    where: {
      purchasedBy: {
        id: user.id
      }
    },
    select: {
      paypalOrderId: true,
      purchasedAt: true,
      cost: true,
      services: true,
      forTournament: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return {
    user,
    purchases
  };
}) satisfies PageServerLoad;

import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  let purchases = prisma.purchase.findMany({
    orderBy: {
      purchasedAt: "desc"
    },
    select: {
      id: true,
      purchasedAt: true,
      cost: true,
      paypalOrderId: true,
      services: true,
      purchasedBy: {
        select: {
          id: true,
          osuUsername: true
        }
      },
      forTournament: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  
  return {
    purchases
  };
}) satisfies PageServerLoad;

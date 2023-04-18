import prisma from '$prisma';
import { z } from 'zod';
import { getUrlParams, paginate } from '$lib/server-utils';
import { prismaSortSchema } from '$lib/schemas';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();
  let { sort, page, search } = getUrlParams(url, z.object({}), z.object({
    purchasedAt: prismaSortSchema.default('desc')
  }));

  let containsSearch = {
    contains: search
  };

  let purchases = prisma.purchase.findMany({
    ... paginate(page),
    where: {
      OR: [{
        forTournament: {
          name: containsSearch
        }
      }, {
        forTournament: {
          acronym: containsSearch
        }
      }, {
        paypalOrderId: containsSearch
      }, {
        purchasedBy: {
          osuUsername: containsSearch
        }
      }, {
        purchasedBy: {
          discordUsername: containsSearch
        }
      }]
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
    },
    orderBy: {
      purchasedAt: sort.purchasedAt
    }
  });

  return {
    purchases
  };
}) satisfies PageServerLoad;

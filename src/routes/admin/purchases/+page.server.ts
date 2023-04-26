import prisma from '$prisma';
import { z } from 'zod';
import { getUrlParams, paginate } from '$lib/server-utils';
import { prismaSortSchema } from '$lib/schemas';
import type { PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';

export const load = (async ({ parent, url }) => {
  await parent();
  let { sort, page, search } = getUrlParams(
    url,
    z.object({}),
    z.object({
      purchasedAt: prismaSortSchema
    })
  );

  let containsSearch: Prisma.StringFilter = {
    contains: search,
    mode: 'insensitive'
  };

  let where: Prisma.PurchaseWhereInput = {
    OR: [
      {
        forTournament: {
          name: containsSearch
        }
      },
      {
        forTournament: {
          acronym: containsSearch
        }
      },
      {
        paypalOrderId: containsSearch
      },
      {
        purchasedBy: {
          osuUsername: containsSearch
        }
      },
      {
        purchasedBy: {
          discordUsername: containsSearch
        }
      }
    ]
  };

  let purchases = prisma.purchase.findMany({
    ...paginate(page),
    where,
    select: {
      id: true,
      purchasedAt: true,
      cost: true,
      paypalOrderId: true,
      services: true,
      purchasedBy: {
        select: {
          id: true,
          osuUsername: true,
          osuUserId: true
        }
      },
      forTournament: {
        select: {
          id: true,
          name: true,
          acronym: true
        }
      }
    },
    orderBy: {
      purchasedAt: sort.purchasedAt || 'desc'
    }
  });
  let purchaseCount = prisma.purchase.count({ where });

  return {
    purchases,
    purchaseCount,
    page
  };
}) satisfies PageServerLoad;

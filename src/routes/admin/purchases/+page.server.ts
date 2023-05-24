import prisma from '$prisma';
import db from '$db';
import { asc, desc, or, eq, sql } from 'drizzle-orm';
import { dbPurchase, dbUser, dbTournament } from '$db/schema';
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

  // let resp = await db.query.dbPurchase.findMany({
  //   where: search ? or(
  //     eq(dbPurchase.payPalOrderId, search),
  //     sql`to_tsvector('simple', ${dbUser.osuUsername} ${dbUser.discordUsername} ${dbTournament.name} ${dbTournament.acronym}) @@ to_tsquery('simple', '${search}')`
  //   ) : undefined,
  //   columns: {
  //     id: true,
  //     purchasedAt: true,
  //     cost: true,
  //     payPalOrderId: true,
  //     services: true
  //   },
  //   with: {
  //     purchasedBy: {
  //       columns: {
  //         id: true,
  //         osuUsername: true,
  //         osuUserId: true
  //       }
  //     },
  //     forTournament: {
  //       columns: {
  //         id: true,
  //         name: true,
  //         acronym: true
  //       }
  //     }
  //   },
  //   orderBy: sort.purchasedAt === 'asc' ? asc(dbPurchase.purchasedAt) : desc(dbPurchase.purchasedAt)
  // });

  return {
    purchases,
    purchaseCount,
    page
  };
}) satisfies PageServerLoad;

import db from '$db';
import { or, eq } from 'drizzle-orm';
import { dbPurchase, dbUser, dbTournament } from '$db/schema';
import { z } from 'zod';
import {
  getUrlParams,
  paginate,
  orderBy,
  getRowCount,
  textSearch,
  select
} from '$lib/server-utils';
import { sortSchema } from '$lib/schemas';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();
  let { sort, page, search } = getUrlParams(
    url,
    z.object({}),
    z.object({
      purchasedAt: sortSchema
    })
  );
  let { offset, limit } = paginate(page);
  let where = or(
    search
      ? textSearch(
          dbTournament.name,
          dbTournament.acronym,
          dbUser.osuUsername,
          dbUser.discordUsername
        ).query(search)
      : undefined,
    eq(dbPurchase.payPalOrderId, search)
  );

  let qPurchases = db
    .select({
      ...select(dbPurchase, ['id', 'purchasedAt', 'cost', 'payPalOrderId', 'services']),
      purchasedBy: select(dbUser, ['id', 'osuUsername', 'osuUserId']),
      forTournament: select(dbTournament, ['id', 'name', 'acronym'])
    })
    .from(dbPurchase)
    .where(where)
    .innerJoin(dbUser, eq(dbUser.id, dbPurchase.purchasedById))
    .innerJoin(dbTournament, eq(dbTournament.id, dbPurchase.forTournamentId))
    .orderBy(orderBy(dbPurchase.purchasedAt, sort.purchasedAt || 'desc'))
    .offset(offset)
    .limit(limit);

  let qPurchaseCount = getRowCount(dbPurchase, where);
  let [purchases, purchaseCount] = await Promise.all([qPurchases, qPurchaseCount]);

  return {
    purchases,
    purchaseCount,
    page
  };
}) satisfies PageServerLoad;

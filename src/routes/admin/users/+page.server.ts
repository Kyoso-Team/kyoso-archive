import db from '$db';
import { dbCountry, dbUser } from '$db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  getRowCount,
  getUrlParams,
  orderBy,
  paginate,
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
      registeredAt: sortSchema
    })
  );
  let { offset, limit } = paginate(page);
  let where = or(
    textSearch(dbUser.osuUsername, dbUser.discordUsername).query(search),
    sql`${dbUser.osuUserId}::text = '${search}'`,
    eq(dbUser.discordUserId, search)
  );

  let qUsers = db
    .select({
      ...select(dbUser, [
        'id',
        'isAdmin',
        'isRestricted',
        'osuUsername',
        'osuUserId',
        'discordUsername',
        'discordDiscriminator'
      ]),
      country: select(dbCountry, [
        'name',
        'code'
      ])
    })
    .from(dbUser)
    .where(search ? where : undefined)
    .innerJoin(dbCountry, eq(dbCountry.id, dbUser.countryId))
    .orderBy(orderBy(dbUser.registeredAt, sort.registeredAt || 'desc'))
    .offset(offset)
    .limit(limit);

  let qUserCount = getRowCount(dbUser, where);
  let [users, userCount] = await Promise.all([qUsers, qUserCount]);

  return {
    users,
    userCount,
    page
  };
}) satisfies PageServerLoad;

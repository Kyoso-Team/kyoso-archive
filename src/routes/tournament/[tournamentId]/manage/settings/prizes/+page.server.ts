import db from '$db';
import { dbPrize, dbPrizeCash } from '$db/schema';
import { eq, asc } from 'drizzle-orm';
import { select } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the prizes for tournament of ID ${data.tournament.id}.`
    );
  }

  let prizes = await db
    .select({
      ...select(dbPrize, [
        'id',
        'type',
        'placements',
        'trophy',
        'medal',
        'badge',
        'banner',
        'additionalItems',
        'monthsOsuSupporter'
      ]),
      cash: select(dbPrizeCash, ['currency', 'metric', 'value'])
    })
    .from(dbPrize)
    .where(eq(dbPrize.tournamentId, data.tournament.id))
    .innerJoin(dbPrizeCash, eq(dbPrizeCash.inPrizeId, dbPrize.id))
    .orderBy(asc(dbPrize.placements));

  return {
    prizes,
    id: data.tournament.id,
    name: data.tournament.name,
    acronym: data.tournament.acronym,
    services: data.tournament.services
  };
}) satisfies PageServerLoad;

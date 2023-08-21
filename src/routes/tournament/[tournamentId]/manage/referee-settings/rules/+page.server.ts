import db from '$db';
import { dbTournament } from '$db/schema';
import { eq } from 'drizzle-orm';
import { hasPerms } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { findFirstOrThrow } from '$lib/server-utils';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
    throw error(
      401,
      `You lack the necessary permissions to manage the rules for tournament of ID ${data.tournament.id}.`
    );
  }

  let { rules } = findFirstOrThrow(
    await db
      .select({
        rules: dbTournament.rules
      })
      .from(dbTournament)
      .where(eq(dbTournament.id, data.tournament.id)),
    'tournament'
  );

  return {
    id: data.tournament.id,
    name: data.tournament.name,
    acronym: data.tournament.acronym,
    rules
  };
}) satisfies PageServerLoad;

import { hasPermissions } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { db, Tournament } from '$db';
import { apiError, pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, route, depends }) => {
  depends('reload:manage_rules');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
    error(401, 'You don\'t have the necessary permissions to access this page');
  }

  let rules!: Pick<typeof Tournament.$inferSelect, 'rules'>;

  try {
    rules = await db
      .select(pick(Tournament, ['rules']))
      .from(Tournament)
      .where(eq(Tournament.id, tournament.id))
      .limit(1)
      .then((tournaments) => tournaments[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the tournament\'s rules', route);
  }

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...rules
    }
  };
}) satisfies PageServerLoad;

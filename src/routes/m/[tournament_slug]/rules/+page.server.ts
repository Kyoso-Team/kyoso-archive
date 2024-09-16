import { hasPermissions } from '$lib/utils';
import { db } from '$lib/server/services';
import { Tournament } from '$db';
import { pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import { catcher, error } from '$lib/server/error';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_rules');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
    error('page', 'unauthorized', "You don't have the necessary permissions to access this page");
  }

  const rules = await db
    .select(pick(Tournament, ['rules']))
    .from(Tournament)
    .where(eq(Tournament.id, tournament.id))
    .limit(1)
    .then((tournaments) => tournaments[0])
    .catch(catcher('page', 'Getting the tournament\'s rules'));

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...rules
    }
  };
}) satisfies PageServerLoad;

import { db } from '$lib/server/services';
import { Tournament } from '$db';
import { pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import { catcher } from '$lib/server/error';
import { checks } from '$lib/server/checks';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_rules');
  const { staffMember, tournament } = await parent();
  checks.page.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

  const rules = await db
    .select(pick(Tournament, ['rules']))
    .from(Tournament)
    .where(eq(Tournament.id, tournament.id))
    .limit(1)
    .then((tournaments) => tournaments[0])
    .catch(catcher('page', "Getting the tournament's rules"));

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...rules
    }
  };
}) satisfies PageServerLoad;

import { hasPermissions } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { db, Tournament } from '$db';
import { apiError, pick } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, route, depends }) => {
  depends('reload:manage_assets');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets'])) {
    error(401, 'You don\'t have the necessary permissions to access this page.');
  }

  let assets!: Pick<typeof Tournament.$inferSelect, 'logoMetadata' | 'bannerMetadata'>;

  try {
    assets = await db
      .select(pick(Tournament, ['logoMetadata', 'bannerMetadata']))
      .from(Tournament)
      .where(eq(Tournament.id, tournament.id))
      .limit(1)
      .then((tournaments) => tournaments[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the tournament\'s assets', route);
  }

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...assets
    }
  };
}) satisfies PageServerLoad;

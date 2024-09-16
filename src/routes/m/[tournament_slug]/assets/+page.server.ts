import { hasPermissions } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { getTournament } from '$lib/server/context';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_assets');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets'])) {
    error(401, "You don't have the necessary permissions to access this page");
  }

  const assets = await getTournament(
    'page',
    tournament.id,
    {
      tournament: ['logoMetadata', 'bannerMetadata']
    },
    true
  );

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...assets
    }
  };
}) satisfies PageServerLoad;

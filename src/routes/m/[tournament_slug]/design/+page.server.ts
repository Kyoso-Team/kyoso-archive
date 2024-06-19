import { hasPermissions } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { getTournament } from '$lib/server/helpers/api';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, route, depends }) => {
  depends('reload:manage_design');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets', 'manage_theme'])) {
    error(401, "You don't have the necessary permissions to access this page");
  }

  const design = await getTournament(
    tournament.id,
    {
      tournament: ['logoMetadata', 'bannerMetadata', 'theme']
    },
    route,
    true
  );

  return {
    manageAssets: staffMember.permissions.includes('manage_assets'),
    manageTheme: staffMember.permissions.includes('manage_theme'),
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...design
    }
  };
}) satisfies PageServerLoad;

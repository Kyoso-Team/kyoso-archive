import { getTournament } from '$lib/server/context';
import { checks } from '$lib/server/checks';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_assets');
  const { staffMember, tournament } = await parent();
  checks.page.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets']);

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

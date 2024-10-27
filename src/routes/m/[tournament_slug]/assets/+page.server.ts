import { checks } from '$lib/server/checks';
import { getTournament } from '$lib/server/context';
import { getBuckets, getImageUrl, getTournamentBannerFileNames, getTournamentLogoFileNames } from '$lib/server/storage';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_assets');
  const { staffMember, tournament } = await parent();
  checks.page.staffHasPermissions(staffMember, [
    'host',
    'debug',
    'manage_tournament',
    'manage_assets'
  ]);

  const assets = await getTournament(
    'page',
    tournament.id,
    {
      tournament: ['logoMetadata', 'bannerMetadata']
    },
    true
  );

  const logo = getTournamentLogoFileNames(tournament.id);
  const banner = getTournamentBannerFileNames(tournament.id);
  const buckets = await getBuckets('page', { dontCreate: true });
  const logoSrc = assets.logoMetadata ? await getImageUrl('page', buckets.public, logo.full) : undefined;
  const bannerSrc = assets.bannerMetadata ? await getImageUrl('page', buckets.public, banner.full) : undefined;

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      logoSrc,
      bannerSrc,
      ...assets
    }
  };
}) satisfies PageServerLoad;

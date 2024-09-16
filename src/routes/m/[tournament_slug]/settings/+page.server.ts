import { checks } from '$lib/server/checks';
import { getTournament } from '$lib/server/context';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
  depends('reload:manage_settings');
  const { staffMember, tournament } = await parent();
  checks.page.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

  const settings = await getTournament(
    'page',
    tournament.id,
    {
      tournament: [
        'name',
        'type',
        'rankRange',
        'teamSettings',
        'bwsValues',
        'links',
        'refereeSettings',
        'modMultipliers'
      ],
      dates: [
        'publishedAt',
        'concludesAt',
        'playerRegsOpenAt',
        'playerRegsCloseAt',
        'staffRegsOpenAt',
        'staffRegsCloseAt',
        'other'
      ]
    },
    true
  );

  return {
    tournament: {
      id: tournament.id,
      urlSlug: tournament.urlSlug,
      acronym: tournament.acronym,
      ...settings
    },
    isHost: staffMember.permissions.includes('host')
  };
}) satisfies PageServerLoad;

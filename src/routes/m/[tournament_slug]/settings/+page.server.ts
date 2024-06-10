import { hasPermissions } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { getTournament } from '$lib/server/helpers/api';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, route, depends }) => {
  depends('reload:manage_settings');
  const { staffMember, tournament } = await parent();

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
    error(401, 'You don\'t have the necessary permissions to access this page.');
  }

  const settings = await getTournament(tournament.id, {
    tournament: ['name', 'type', 'rankRange', 'teamSettings', 'bwsValues', 'links', 'refereeSettings', 'modMultipliers'],
    dates: ['publishedAt', 'concludesAt', 'playerRegsOpenAt', 'playerRegsCloseAt', 'staffRegsOpenAt', 'staffRegsCloseAt', 'other']
  }, route, true);

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

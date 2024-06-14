import * as f from '$lib/form-validation';
import { keys } from './utils';
import type { StaffPermission, TournamentType } from '$db';
import type { InferEnum } from '$types';

export const lower32BitIntLimit = -2147483648;
export const upper32BitIntLimit = 4294967296;

/** GMT: Saturday, February 24, 2024 12:00:00 AM */
export const oldestDatePossible = new Date(1708732800000);
/** GMT: Wednesday, Janaury 1st, 3000 12:00:00 PM */
export const maxPossibleDate = new Date(32503680000000);

export const tournamentTypeOptions: Record<InferEnum<typeof TournamentType>, string> = {
  draft: 'Draft',
  solo: 'Solo',
  teams: 'Teams'
};

export const baseTournamentFormSchemas = {
  name: f.string([f.minStrLength(2), f.maxStrLength(50)]),
  acronym: f.string([f.minStrLength(2), f.maxStrLength(8)]),
  urlSlug: f.string([f.minStrLength(2), f.maxStrLength(16), f.slug()]),
  type: f.union(keys(tournamentTypeOptions)),
  openRank: f.boolean()
};

export const baseTeamSettingsFormSchemas = {
  minTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)]),
  maxTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)])
};

export const rankRangeFormSchemas = {
  lower: f.number([f.integer(), f.minValue(1), f.maxIntLimit()]),
  upper: f.optional(f.number([f.integer(), f.minValue(1), f.maxIntLimit()]))
};

export const staffPermissionsOptions: Record<InferEnum<typeof StaffPermission>, string> = {
  host: 'Host',
  debug: 'Debug',
  manage_tournament: 'Manage tournament',
  manage_assets: 'Manage assets',
  manage_theme: 'Manage theme',
  manage_regs: 'Manage regs.',
  manage_pool_structure: 'Manage pool structure',
  view_pool_suggestions: 'View pool suggestions',
  create_pool_suggestions: 'Create pool suggestions',
  delete_pool_suggestions: 'Delete pool suggestions',
  view_pooled_maps: 'View pooled maps',
  manage_pooled_maps: 'Manage pooled maps',
  view_feedback: 'View feedback',
  can_playtest: 'Can playtest',
  can_submit_replays: 'Can submit replays',
  view_matches: 'View matches',
  manage_matches: 'Manage matches',
  ref_matches: 'Ref matches',
  commentate_matches: 'Commentate matches',
  stream_matches: 'Stream matches',
  manage_stats: 'Manage stats',
  can_play: 'Can play'
};

import { pgEnum } from 'drizzle-orm/pg-core';

export const TournamentType = pgEnum('tournament_type', ['teams', 'draft', 'solo']);

export const RoundType = pgEnum('round_type', [
  'groups',
  'swiss',
  'qualifiers',
  'single_elim',
  'double_elim',
  'battle_royale'
]);

export const StaffPermission = pgEnum('staff_permission', [
  // Prefixes:
  // View: Get data
  // Create: Create data
  // Delete: Delete data
  // Manage: Create, update and delete data

  // Host can do everything regardless of other permissions, can also delete the tournament. Only one user can have this permission per tournament
  'host',
  // Same as above. This exists so a host can add this permission to a site admin to allow them to debug something without listing them as an actual staff member,
  'debug',
  // Manage some (but not all) tournament settings. Can also manage staff members and roles
  'manage_tournament',
  // Tournament assets (upload and delete banner and logo)
  'manage_assets',
  // Player regs.
  'manage_regs',
  // Mappool structure,
  'manage_pool_structure',
  // Suggest maps
  'view_pool_suggestions',
  'create_pool_suggestions',
  'delete_pool_suggestions',
  // Pool maps,
  'view_pooled_maps',
  'manage_pooled_maps',
  // Playtest
  'view_feedback',
  'can_playtest',
  'can_submit_replays',
  // Matches
  'view_matches',
  'manage_matches',
  'ref_matches',
  'commentate_matches',
  'stream_matches',
  // Stats
  'manage_stats',
  // Misc.
  'can_play' // Can play in the tournament
]);

export const StaffColor = pgEnum('staff_color', [
  'slate',
  'gray',
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'emerald',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'fuchsia',
  'pink'
]);

export const InviteStatus = pgEnum('invite_status', [
  'pending',
  'accepted',
  'rejected',
  'cancelled'
]);

export const InviteReason = pgEnum('invite_reason', ['join_team', 'join_staff', 'delegate_host']);

export const TournamentFormType = pgEnum('tournament_form_type', ['general', 'staff_registration']);

export const TournamentFormTarget = pgEnum('tournament_form_target', [
  'public',
  'staff',
  'players',
  'team_captains'
]);

import { pgEnum } from 'drizzle-orm/pg-core';

export const dbUserTheme = pgEnum('user_theme', [
  'light',
  'dark'
]);

export const dbTournamentType = pgEnum('tournament_type', [
  'teams',
  'draft',
  'solo'
]);

export const dbWinCondition = pgEnum('win_condition', [
  'score',
  'accuracy',
  'combo',
  'misses'
]);

export const dbBanOrder = pgEnum('ban_oder', [
  'ABABAB',
  'ABBAAB'
]);

export const dbTournamentService = pgEnum('tournament_service', [
  'registrations', // Specifically player and staff registrations
  'mappooling',
  'referee',
  'stats',
  'pickems'
]);

export const dbPrizeType = pgEnum('prize_type', [
  'tournament',
  'pickems'
]);

export const dbCashMetric = pgEnum('cash_metric', [
  'fixed',
  'percent'
]);

export const dbStageFormat = pgEnum('stage_format', [
  'groups',
  'swiss',
  'qualifiers',
  'single_elim',
  'double_elim',
  'battle_royale'
]);

export const dbMappoolState = pgEnum('mappool_state', [
  'private',
  'playtesting',
  'public'
]);

export const dbQualifierRunsSummary = pgEnum('qualifier_runs_summary', [
  'average', // Calculate the average score for each map in all runs
  'sum', // Calculate the sum of scores for each map in all runs
  'best' // Get the best score for each map
]);

export const dbStaffPermission = pgEnum('staff_permission', [
  // Prefixes:
  // View: Get data
  // Mutate: Create and update data
  // Delete: Delete data

  // Host can do everything regardless of other permissions, can also delete the tournament. Only one user can have this permission per tournament
  'host',
  // Tournament
  'mutate_tournament',
  // Staff and staff regs.
  'view_staff_members',
  'mutate_staff_members',
  'delete_staff_members',
  // Player regs.
  'view_player_regs',
  'mutate_player_regs',
  'delete_player_regs',
  // Mappool structure,
  'view_pool_structure',
  'mutate_pool_structure',
  // Suggest maps
  'view_pool_suggestions',
  'mutate_pool_suggestions',
  'delete_pool_suggestions',
  // Pool maps,
  'view_pooled_maps',
  'delete_pooled_maps',
  // Playtest (provide replays and feedback)
  'view_maps_to_playtest',
  'mutate_maps_to_playtest', // Can replay and provide feedback
  'delete_maps_to_playtest',
  // Matches
  'view_matches',
  'mutate_matches',
  'delete_matches',
  'ref_matches',
  'commentate_matches',
  'stream_matches',
  // Stats
  'view_stats',
  'mutate_stats', // Can calculate stats
  'delete_stats',
  // Misc.
  'can_play' // Can play in the tournament
]);

export const dbStaffColor = pgEnum('staff_color', [
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

export const dbJoinRequestStatus = pgEnum('join_request_status', [
  'pending', // Pending response
  'accepted',
  'rejected'
]);

export const dbMod = pgEnum('mod', [
  'ez',
  'hd',
  'hr',
  'sd',
  'dt',
  'rx',
  'ht',
  'fl',
  'pf'
]);

export const dbSkillset = pgEnum('skillset', [
  'consistency',
  'streams',
  'tech',
  'alt',
  'speed',
  'gimmick',
  'rhythm',
  'aim',
  'awkward_aim',
  'flow_aim',
  'reading',
  'precision',
  'stamina',
  'finger_control',
  'jack_of_all_trades'
]);

export const dbOpponent = pgEnum('opponent', [
  'opponent1',
  'opponent2'
]);

export const dbIssueType = pgEnum('issue_type', [
  'security', // Security vulnerability
  'enhancement',
  'new_feature',
  'bug',
  'user_behavior' // Inappropriate behavior from a user
]);

export const dbNotifIssueType = pgEnum('notification_issue_type', [
  'submission',
  'resolved'
]);

export const dbNotifStaffChangeAction = pgEnum('notification_staff_change_action', [
  'added',
  'removed'
]);

export const dbNotifTeamChangeAction = pgEnum('notification_team_change_action', [
  'joined',
  'left',
  'kicked'
]);

export const dbNotifRoundPublicationType = pgEnum('notification_round_publication_type', [
  'mappool',
  'schedules',
  'statistics'
]);

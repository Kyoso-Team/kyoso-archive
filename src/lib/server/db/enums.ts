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

// export const dbJoinRequestStatus = pgEnum('join_request_status', [
//   'pending', // Pending response
//   'accepted',
//   'rejected'
// ]);

// export const dbMod = pgEnum('mod', ['ez', 'hd', 'hr', 'sd', 'dt', 'rx', 'ht', 'fl', 'pf']);

// export const dbSkillset = pgEnum('skillset', [
//   'consistency',
//   'streams',
//   'tech',
//   'alt',
//   'speed',
//   'gimmick',
//   'rhythm',
//   'aim',
//   'awkward_aim',
//   'flow_aim',
//   'reading',
//   'precision',
//   'stamina',
//   'finger_control',
//   'jack_of_all_trades'
// ]);

// export const dbOpponent = pgEnum('opponent', ['opponent1', 'opponent2']);

// export const dbIssueType = pgEnum('issue_type', [
//   'security', // Security vulnerability
//   'enhancement',
//   'new_feature',
//   'bug',
//   'user_behavior' // Inappropriate behavior from a user
// ]);

// export const dbIssueNotifType = pgEnum('issue_notification_type', ['submission', 'resolved']);

// export const dbStaffChangeNotifAction = pgEnum('staff_change_notification_action', [
//   'added',
//   'removed'
// ]);

// export const dbTeamChangeNotifAction = pgEnum('team_change_notification_action', [
//   'joined',
//   'left',
//   'kicked'
// ]);

// export const dbRoundPublicationNotifType = pgEnum('round_publication_notification_type', [
//   'mappool',
//   'schedules',
//   'statistics'
// ]);

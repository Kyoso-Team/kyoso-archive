import { pgTable, serial, uniqueIndex, varchar, timestamp, boolean, integer, text, char, type AnyPgColumn, unique, smallint, real } from 'drizzle-orm/pg-core';
import { dbStaffColor, dbStaffPermission, dbTournament, dbUser, dbStaffMemberToStaffRole, dbQualLobbyToTeam, dbPlayedQualMapToTeam, dbJoinRequestStatus, dbJoinTeamRequestNotif, dbKnockoutLobbyToPlayer, dbKnockoutLobbyToTeam, dbLobbyToStaffMemberAsCommentator, dbLobbyToStaffMemberAsReferee, dbLobbyToStaffMemberAsStreamer, dbMatch, dbNewStaffAppSubmissionNotif, dbPlayedKnockoutMapToPlayerAsKnockedOut, dbPlayedKnockoutMapToPlayerAsPlayed, dbPlayedKnockoutMapToTeamAsKnockedOut, dbPlayedKnockoutMapToTeamAsPlayed, dbPlayedQualMapToPlayer, dbPlayerScore, dbPooledMap, dbPooledMapRating, dbPotentialMatch, dbQualLobbyToPlayer, dbQualPrediction, dbSuggestedMap, dbTeamChangeNotif, dbTeamScore } from '.';
import { timestampConfig, length, relation, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbStaffRole = pgTable('staff_role', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(25)).notNull(),
  color: dbStaffColor('color').notNull().default('slate'),
  order: smallint('order').notNull(),
  permissions: dbStaffPermission('permissions').array(dbStaffPermission.enumValues.length).notNull().default([]),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  nameTournamentIdKey: unique('staff_role_name_tournament_id_key').on(tbl.name, tbl.tournamentId)
}));

export const dbStaffRoleRelations = relations(dbStaffRole, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbStaffRole.tournamentId],
    references: [dbTournament.id]
  }),
  staffMembers: many(dbStaffMemberToStaffRole)
}));

export const dbStaffMember = pgTable('staff_member', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => dbUser.id, actions('cascade')),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  userIdTournamentIdKey: unique('staff_member_user_id_tournament_id_key').on(tbl.userId, tbl.tournamentId)
}));

export const dbStaffMemberRelations = relations(dbStaffMember, ({ one, many }) => ({
  user: one(dbUser, {
    fields: [dbStaffMember.userId],
    references: [dbUser.id]
  }),
  tournament: one(dbTournament, {
    fields: [dbStaffMember.tournamentId],
    references: [dbTournament.id]
  }),
  roles: many(dbStaffMemberToStaffRole),
  suggestedMaps: many(dbSuggestedMap),
  suggestedPooledMaps: many(dbPooledMap, relation('suggested_by')),
  pooledMaps: many(dbPooledMap, relation('pooled_by')),
  asReferee: many(dbLobbyToStaffMemberAsReferee),
  asStreamer: many(dbLobbyToStaffMemberAsStreamer),
  asCommentator: many(dbLobbyToStaffMemberAsCommentator),
  pooledMapsRatingsGiven: many(dbPooledMapRating)
}));

export const dbStaffApplication = pgTable('staff_application', {
  title: varchar('title', length(75)).notNull(),
  description: text('description'),
  forTournamentId: integer('tournament_id').primaryKey().references(() => dbTournament.id, actions('cascade'))
});

export const dbStaffApplicationRelations = relations(dbStaffApplication, ({ one, many }) => ({
  forTournament: one(dbTournament, {
    fields: [dbStaffApplication.forTournamentId],
    references: [dbTournament.id]
  }),
  lookingFor: many(dbStaffAppRole),
  submissions: many(dbStaffAppSubmission)
}));

export const dbStaffAppRole = pgTable('staff_application_role', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(25)).notNull(),
  description: text('description'),
  staffApplicationId: integer('staff_application_id').notNull().references(() => dbStaffApplication.forTournamentId, actions('cascade'))
}, (tbl) => ({
  nameStaffApplicationIdKey: uniqueIndex('staff_application_role_name_staff_application_id_key').on(tbl.name, tbl.staffApplicationId)
}));

export const dbStaffAppRoleRelations = relations(dbStaffAppRole, ({ one }) => ({
  staffApplcation: one(dbStaffApplication, {
    fields: [dbStaffAppRole.id],
    references: [dbStaffApplication.forTournamentId]
  })
}));

export const dbStaffAppSubmission = pgTable('staff_application_submission', {
  id: serial('id').primaryKey(),
  applyingFor: varchar('applying_for', length(25)).array().notNull().default([]),
  status: dbJoinRequestStatus('status').notNull().default('pending'),
  staffingExperience: text('staffing_experience').notNull(),
  additionalComments: text('additional_comments'),
  staffApplicationId: integer('staff_application_id').notNull().references(() => dbStaffApplication.forTournamentId, actions('cascade')),
  submittedById: integer('submitted_by_id').notNull().references(() => dbUser.id, actions('cascade'))
});

export const dbStaffAppSubmissionRelations = relations(dbStaffAppSubmission, ({ one, many }) => ({
  staffApplication: one(dbStaffApplication, {
    fields: [dbStaffAppSubmission.staffApplicationId],
    references: [dbStaffApplication.forTournamentId]
  }),
  submittedBy: one(dbUser, {
    fields: [dbStaffAppSubmission.submittedById],
    references: [dbUser.id]
  }),
  inNewStaffAppSubmissionNotifs: many(dbNewStaffAppSubmissionNotif)
}));

export const dbTeam = pgTable('team', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  name: varchar('name', length(20)).notNull(),
  inviteId: char('invite_id', length(8)).notNull().unique('team_invite_id_key'),
  hasBanner: boolean('has_banner').notNull().default(false),
  avgRank: real('average_rank').notNull(),
  avgBwsRank: real('average_bws_rank').notNull(),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade')),
  captainId: integer('captain_id').notNull().references(() => dbPlayer.id).unique('team_captain_id_key')
}, (tbl) => ({ 
  nameTournamentIdKey: unique('team_name_tournament_id_key').on(tbl.name, tbl.tournamentId)
}));

export const dbTeamRelations = relations(dbTeam, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbTeam.tournamentId],
    references: [dbTournament.id]
  }),
  captain: one(dbPlayer, {
    fields: [dbTeam.captainId],
    references: [dbPlayer.id],
    relationName: 'captain'
  }),
  players: many(dbPlayer, relation('player')),
  asTeam1: many(dbMatch, relation('team_1')),
  asTeam2: many(dbMatch, relation('team_2')),
  asPotentialTeam1: many(dbPotentialMatch, relation('potential_team_1')),
  asPotentialTeam2: many(dbPotentialMatch, relation('potential_team_2')),
  inQualLobbies: many(dbQualLobbyToTeam),
  playedQualMaps: many(dbPlayedQualMapToTeam),
  inKnockoutLobbies: many(dbKnockoutLobbyToTeam),
  playedKnockoutMaps: many(dbPlayedKnockoutMapToTeamAsPlayed),
  knockedOutInMaps: many(dbPlayedKnockoutMapToTeamAsKnockedOut),
  scores: many(dbTeamScore),
  inTeamChangeNotifs: many(dbTeamChangeNotif),
  inQualPredictions: many(dbQualPrediction)
}));

export const dbJoinTeamRequest = pgTable('join_team_request', {
  id: serial('id').primaryKey(),
  requestedAt: timestamp('requested_at', timestampConfig).notNull().defaultNow(),
  status: dbJoinRequestStatus('status').notNull().default('pending'),
  sentById: integer('sent_by_id').notNull().references(() => dbPlayer.id)
});

export const dbJoinTeamRequestRelations = relations(dbJoinTeamRequest, ({ one, many }) => ({
  sentBy: one(dbPlayer, {
    fields: [dbJoinTeamRequest.sentById],
    references: [dbPlayer.id]
  }),
  inJoinTeamRequestNotifs: many(dbJoinTeamRequestNotif)
}));

// If the player is in a team tournament and doesn't have a team, then they're a free agent
export const dbPlayer = pgTable('player', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  availability: char('availability', length(99)).notNull(), // A string that represents the availability between 0 - 23 UTC (24 digits), from Friday to Monday
  // Where each digit can be either 0 (unavailable) or 1 (available)
  // Each day is separated by a period, similarly to an IP address
  rank: integer('rank').notNull(),
  bwsRank: integer('bws_rank').notNull(), // Make it a generated column when that feature lands in Drizzle
  badgeCount: integer('badge_count').notNull(),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade')),
  userId: integer('user_id').notNull().references(() => dbUser.id, actions('cascade')),
  teamId: integer('team_id').references((): AnyPgColumn => dbTeam.id)
}, (tbl) => ({
  userIdTournamentIdKey: unique('player_user_id_tournament_id_key').on(tbl.userId, tbl.tournamentId)
}));

export const dbPlayerRelations = relations(dbPlayer, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbPlayer.tournamentId],
    references: [dbTournament.id]
  }),
  user: one(dbUser, {
    fields: [dbPlayer.userId],
    references: [dbUser.id]
  }),
  team: one(dbTeam, {
    fields: [dbPlayer.teamId],
    references: [dbTeam.id],
    relationName: 'player'
  }),
  asPlayer1: many(dbMatch, relation('player_1')),
  asPlayer2: many(dbMatch, relation('player_2')),
  asPotentialPlayer1: many(dbPotentialMatch, relation('potential_player_1')),
  asPotentialPlayer2: many(dbPotentialMatch, relation('potential_player_2')),
  inQualLobbies: many(dbQualLobbyToPlayer),
  playedQualMaps: many(dbPlayedQualMapToPlayer),
  inKnockoutLobbies: many(dbKnockoutLobbyToPlayer),
  playedKnockoutMaps: many(dbPlayedKnockoutMapToPlayerAsPlayed),
  knockedOutInMaps: many(dbPlayedKnockoutMapToPlayerAsKnockedOut),
  scores: many(dbPlayerScore),
  sentJoinTeamRequests: many(dbJoinTeamRequest),
  inQualPredictions: many(dbQualPrediction)
}));

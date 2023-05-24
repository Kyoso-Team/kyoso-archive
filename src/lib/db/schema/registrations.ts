import { pgTable, serial, uniqueIndex, varchar, timestamp, boolean, integer, text, char } from 'drizzle-orm/pg-core';
import { dbStaffColor, dbStaffPermission, dbTournament, dbUser, dbStaffMemberToStaffRole, dbPrize, dbQualLobbyToTeam, dbPlayedQualMapToTeam, dbJoinRequestStatus, dbJoinTeamRequestNotif, dbKnockoutLobbyToPlayer, dbKnockoutLobbyToTeam, dbLobbyToStaffMemberAsCommentator, dbLobbyToStaffMemberAsReferee, dbLobbyToStaffMemberAsStreamer, dbMatch, dbNewStaffAppSubmissionNotif, dbPlayedKnockoutMapToPlayerAsKnockedOut, dbPlayedKnockoutMapToPlayerAsPlayed, dbPlayedKnockoutMapToTeamAsKnockedOut, dbPlayedKnockoutMapToTeamAsPlayed, dbPlayedQualMapToPlayer, dbPlayerScore, dbPooledMap, dbPooledMapRating, dbPotentialMatch, dbQualLobbyToPlayer, dbQualPrediction, dbSuggestedMap, dbTeamChangeNotif, dbTeamScore } from '.';
import { timestampConfig, length, relation, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbStaffRole = pgTable('staff_roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(25)).notNull(),
  color: dbStaffColor('color').notNull().default('slate'),
  permissions: dbStaffPermission('permissions').array(dbStaffPermission.enumValues.length).notNull().default([]),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  nameTournamentIdKey: uniqueIndex('name_tournament_id_key').on(tbl.name, tbl.tournamentId)
}));

export const dbStaffRoleRelations = relations(dbStaffRole, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbStaffRole.tournamentId],
    references: [dbTournament.id]
  }),
  staffMembers: many(dbStaffMemberToStaffRole)
}));

export const dbStaffMember = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => dbUser.id, actions('cascade')),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  userIdTournamentIdKey: uniqueIndex('user_id_tournament_id_key').on(tbl.userId, tbl.tournamentId)
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

export const dbStaffApplication = pgTable('staff_applications', {
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

export const dbStaffAppRole = pgTable('staff_application_roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(25)).notNull(),
  description: text('description'),
  staffApplicationId: integer('staff_application_id').notNull().references(() => dbStaffApplication.forTournamentId, actions('cascade'))
}, (tbl) => ({
  nameStaffApplicationIdKey: uniqueIndex('name_staff_application_id_key').on(tbl.name, tbl.staffApplicationId)
}));

export const dbStaffAppRoleRelations = relations(dbStaffAppRole, ({ one }) => ({
  staffApplcation: one(dbStaffApplication, {
    fields: [dbStaffAppRole.id],
    references: [dbStaffApplication.forTournamentId]
  })
}));

export const dbStaffAppSubmission = pgTable('staff_application_submissions', {
  id: serial('id').primaryKey(),
  applyingFor: varchar('applying_for', length(25)).array().notNull().default([]),
  status: dbJoinRequestStatus('status').notNull().default('pending'),
  staffingExperience: text('staffing_experience').notNull(),
  additionalComments: text('additional_comments'),
  staffApplicationId: integer('staff_application_id').notNull().references(() => dbStaffApplication.forTournamentId, actions('cascade'))
});

export const dbStaffAppSubmissionRelations = relations(dbStaffAppSubmission, ({ one, many }) => ({
  staffApplication: one(dbStaffApplication, {
    fields: [dbStaffAppSubmission.staffApplicationId],
    references: [dbStaffApplication.forTournamentId]
  }),
  inNewStaffAppSubmissionNotifs: many(dbNewStaffAppSubmissionNotif)
}));

export const dbTeam = pgTable('teams', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  name: varchar('name', length(20)).notNull(),
  inviteId: char('invite_id', length(8)).notNull(),
  hasBanner: boolean('has_banner').notNull().default(false),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade')),
  captainId: integer('captain_id').notNull().references(() => dbPlayer.id),
  prizeWonId: integer('prize_won_id').references(() => dbPrize.id)
}, (tbl) => ({
  inviteIdKey: uniqueIndex('invite_id_key').on(tbl.inviteId),
  captainIdKey: uniqueIndex('captain_id_key').on(tbl.captainId), 
  nameTournamentIdKey: uniqueIndex('name_tournament_id_key').on(tbl.name, tbl.tournamentId)
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
  prizeWon: one(dbPrize, {
    fields: [dbTeam.prizeWonId],
    references: [dbPrize.id]
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

export const dbJoinTeamRequest = pgTable('join_team_requests', {
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
export const dbPlayer = pgTable('players', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  availability: char('availability', length(99)).notNull(), // A string that represents the availability between 0 - 23 UTC (24 digits), from Friday to Monday
  // Where each digit can be either 0 (unavailable) or 1 (available)
  // Each day is separated by a period, similarly to an IP address
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade')),
  userId: integer('user_id').notNull().references(() => dbUser.id, actions('cascade')),
  teamId: integer('team_id').references(() => dbTeam.id),
  prizeWonId: integer('prize_won_id').references(() => dbPrize.id)
}, (tbl) => ({
  userIdTournamentIdKey: uniqueIndex('user_id_tournament_id_key').on(tbl.userId, tbl.tournamentId)
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
  prizeWon: one(dbPrize, {
    fields: [dbPlayer.prizeWonId],
    references: [dbPrize.id]
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

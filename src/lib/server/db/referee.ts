// import { pgTable, serial, varchar, timestamp, integer, text, unique } from 'drizzle-orm/pg-core';
// import {
//   dbTournament,
//   dbOpponent,
//   dbPooledMap,
//   dbKnockoutLobbyToPlayer,
//   dbKnockoutLobbyToTeam,
//   dbLobbyToStaffMemberAsCommentator,
//   dbLobbyToStaffMemberAsReferee,
//   dbLobbyToStaffMemberAsStreamer,
//   dbMatchPrediction,
//   dbPlayedKnockoutMapToPlayerAsKnockedOut,
//   dbPlayedKnockoutMapToPlayerAsPlayed,
//   dbPlayedKnockoutMapToTeamAsKnockedOut,
//   dbPlayedKnockoutMapToTeamAsPlayed,
//   dbPlayedQualMapToPlayer,
//   dbPlayedQualMapToTeam,
//   dbPlayer,
//   dbPotentialMatchPrediction,
//   dbQualLobbyToPlayer,
//   dbQualLobbyToTeam,
//   dbRound,
//   dbTeam
// } from '.';
// import { timestampConfig, length, actions } from '../utils';
// import { relations } from 'drizzle-orm';

// export const dbLobby = pgTable(
//   'lobby',
//   {
//     id: serial('id').primaryKey(),
//     localId: varchar('local_id', length(5)), // ID assigned in tournament
//     date: timestamp('date', timestampConfig),
//     refNotes: text('referee_notes'),
//     osuMpIds: integer('osu_mp_ids').array().notNull().default([]),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     roundId: integer('round_id')
//       .notNull()
//       .references(() => dbRound.id, actions('cascade'))
//   },
//   (tbl) => ({
//     localIdTournamentIdKey: unique('lobby_local_id_tournament_id_key').on(
//       tbl.localId,
//       tbl.tournamentId
//     )
//   })
// );

// export const dbLobbyRelations = relations(dbLobby, ({ one, many }) => ({
//   tournament: one(dbTournament, {
//     fields: [dbLobby.tournamentId],
//     references: [dbTournament.id]
//   }),
//   round: one(dbRound, {
//     fields: [dbLobby.roundId],
//     references: [dbRound.id]
//   }),
//   referees: many(dbLobbyToStaffMemberAsReferee),
//   streamers: many(dbLobbyToStaffMemberAsStreamer),
//   commentators: many(dbLobbyToStaffMemberAsCommentator)
// }));

// // Swiss, groups, double and single elim.
// export const dbMatch = pgTable('match', {
//   rollWinner: dbOpponent('roll_winner'),
//   banFirst: dbOpponent('ban_first'),
//   pickFirst: dbOpponent('pick_first'),
//   forfeitFrom: dbOpponent('forfeit_from'),
//   winner: dbOpponent('winner'),
//   lobbyId: integer('lobby_id')
//     .primaryKey()
//     .references(() => dbLobby.id, actions('cascade')),
//   // Used in solo tournaments
//   player1Id: integer('player_1_id').references(() => dbPlayer.id),
//   player2Id: integer('player_2_id').references(() => dbPlayer.id),
//   // Used in team tournaments
//   team1Id: integer('team_1_id').references(() => dbTeam.id),
//   team2Id: integer('team_2_id').references(() => dbTeam.id)
// });

// export const dbMatchRelations = relations(dbMatch, ({ one, many }) => ({
//   lobby: one(dbLobby, {
//     fields: [dbMatch.lobbyId],
//     references: [dbLobby.id]
//   }),
//   player1: one(dbPlayer, {
//     fields: [dbMatch.player1Id],
//     references: [dbPlayer.id],
//     relationName: 'player_1'
//   }),
//   player2: one(dbPlayer, {
//     fields: [dbMatch.player2Id],
//     references: [dbPlayer.id],
//     relationName: 'player_2'
//   }),
//   team1: one(dbTeam, {
//     fields: [dbMatch.team1Id],
//     references: [dbTeam.id],
//     relationName: 'team_1'
//   }),
//   team2: one(dbTeam, {
//     fields: [dbMatch.team2Id],
//     references: [dbTeam.id],
//     relationName: 'team_2'
//   }),
//   potentials: many(dbPotentialMatch),
//   playedMaps: many(dbPlayedMap),
//   bannedMaps: many(dbBannedMap),
//   inPredictions: many(dbMatchPrediction)
// }));

// export const dbPlayedMap = pgTable('played_map', {
//   id: serial('id').primaryKey(),
//   winner: dbOpponent('winner').notNull(),
//   pickedBy: dbOpponent('picked_by').notNull(),
//   pooledMapId: integer('pooled_map_id').references(() => dbPooledMap.id),
//   matchId: integer('match_id')
//     .notNull()
//     .references(() => dbMatch.lobbyId)
// });

// export const dbPlayedMapRelations = relations(dbPlayedMap, ({ one }) => ({
//   pooledMap: one(dbPooledMap, {
//     fields: [dbPlayedMap.pooledMapId],
//     references: [dbPooledMap.id]
//   }),
//   match: one(dbMatch, {
//     fields: [dbPlayedMap.matchId],
//     references: [dbMatch.lobbyId]
//   })
// }));

// export const dbBannedMap = pgTable('banned_map', {
//   id: serial('id').primaryKey(),
//   bannedBy: dbOpponent('banned_by').notNull(),
//   pooledMapId: integer('pooled_map_id').references(() => dbPooledMap.id),
//   matchId: integer('match_id')
//     .notNull()
//     .references(() => dbMatch.lobbyId)
// });

// export const dbBannedMapRelations = relations(dbBannedMap, ({ one }) => ({
//   pooledMap: one(dbPooledMap, {
//     fields: [dbBannedMap.pooledMapId],
//     references: [dbPooledMap.id]
//   }),
//   match: one(dbMatch, {
//     fields: [dbBannedMap.matchId],
//     references: [dbMatch.lobbyId]
//   })
// }));

// export const dbPotentialMatch = pgTable(
//   'potential_match',
//   {
//     id: serial('id').primaryKey(),
//     localId: varchar('local_id', length(5)),
//     date: timestamp('date', timestampConfig),
//     matchId: integer('match_id')
//       .notNull()
//       .references(() => dbMatch.lobbyId, actions('cascade')),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     // Used in solo tournaments
//     player1Id: integer('player_1_id').references(() => dbPlayer.id),
//     player2Id: integer('player_2_id').references(() => dbPlayer.id),
//     // Used in team tournaments
//     team1Id: integer('team_1_id').references(() => dbTeam.id),
//     team2Id: integer('team_2_id').references(() => dbTeam.id)
//   },
//   (tbl) => ({
//     localIdTournamentIdKey: unique('potential_match_local_id_tournament_id_key').on(
//       tbl.localId,
//       tbl.tournamentId
//     )
//   })
// );

// export const dbPotentialMatchRelations = relations(dbPotentialMatch, ({ one, many }) => ({
//   match: one(dbMatch, {
//     fields: [dbPotentialMatch.matchId],
//     references: [dbMatch.lobbyId]
//   }),
//   tournament: one(dbTournament, {
//     fields: [dbPotentialMatch.tournamentId],
//     references: [dbTournament.id]
//   }),
//   player1: one(dbPlayer, {
//     fields: [dbPotentialMatch.player1Id],
//     references: [dbPlayer.id],
//     relationName: 'potential_player_1'
//   }),
//   player2: one(dbPlayer, {
//     fields: [dbPotentialMatch.player2Id],
//     references: [dbPlayer.id],
//     relationName: 'potential_player_2'
//   }),
//   team1: one(dbTeam, {
//     fields: [dbPotentialMatch.team1Id],
//     references: [dbTeam.id],
//     relationName: 'potential_team_1'
//   }),
//   team2: one(dbTeam, {
//     fields: [dbPotentialMatch.team2Id],
//     references: [dbTeam.id],
//     relationName: 'potential_team_2'
//   }),
//   inPredictions: many(dbPotentialMatchPrediction)
// }));

// // Qualifier lobby
// export const dbQualLobby = pgTable('qualifier_lobby', {
//   lobbyId: integer('lobby_id')
//     .primaryKey()
//     .references(() => dbLobby.id, actions('cascade'))
// });

// export const dbQualLobbyRelations = relations(dbQualLobby, ({ one, many }) => ({
//   lobby: one(dbLobby, {
//     fields: [dbQualLobby.lobbyId],
//     references: [dbLobby.id]
//   }),
//   teams: many(dbQualLobbyToTeam),
//   players: many(dbQualLobbyToPlayer),
//   playedMaps: many(dbPlayedQualMap)
// }));

// export const dbPlayedQualMap = pgTable('played_qualifier_map', {
//   id: serial('id').primaryKey(),
//   qualLobbyId: integer('qualifier_lobby_id')
//     .notNull()
//     .references(() => dbQualLobby.lobbyId, actions('cascade')),
//   pooledMapId: integer('pooled_map_id').references(() => dbPooledMap.id)
// });

// export const dbPlayedQualMapRelations = relations(dbPlayedQualMap, ({ one, many }) => ({
//   qualLobby: one(dbQualLobby, {
//     fields: [dbPlayedQualMap.qualLobbyId],
//     references: [dbQualLobby.lobbyId]
//   }),
//   pooledMap: one(dbPooledMap, {
//     fields: [dbPlayedQualMap.pooledMapId],
//     references: [dbPooledMap.id]
//   }),
//   teams: many(dbPlayedQualMapToTeam),
//   players: many(dbPlayedQualMapToPlayer)
// }));

// // Battle royale knockout lobby
// export const dbKnockoutLobby = pgTable('knockout_lobby', {
//   lobbyId: integer('lobby_id')
//     .primaryKey()
//     .references(() => dbLobby.id, actions('cascade'))
// });

// export const dbKnockoutLobbyRelations = relations(dbKnockoutLobby, ({ one, many }) => ({
//   lobby: one(dbLobby, {
//     fields: [dbKnockoutLobby.lobbyId],
//     references: [dbLobby.id]
//   }),
//   teams: many(dbKnockoutLobbyToTeam),
//   players: many(dbKnockoutLobbyToPlayer),
//   playedMaps: many(dbPlayedKnockoutMap)
// }));

// export const dbPlayedKnockoutMap = pgTable('played_knockout_map', {
//   id: serial('id').primaryKey(),
//   knockoutLobbyId: integer('knockout_lobby_id')
//     .notNull()
//     .references(() => dbKnockoutLobby.lobbyId, actions('cascade')),
//   pooledMapId: integer('pooled_map_id')
//     .notNull()
//     .references(() => dbPooledMap.id, actions('cascade'))
// });

// export const dbPlayedKnockoutMapRelations = relations(dbPlayedKnockoutMap, ({ one, many }) => ({
//   knockoutLobby: one(dbKnockoutLobby, {
//     fields: [dbPlayedKnockoutMap.knockoutLobbyId],
//     references: [dbKnockoutLobby.lobbyId]
//   }),
//   pooledMap: one(dbPooledMap, {
//     fields: [dbPlayedKnockoutMap.pooledMapId],
//     references: [dbPooledMap.id]
//   }),
//   teamsThatPlayed: many(dbPlayedKnockoutMapToTeamAsPlayed),
//   playersThatPlayed: many(dbPlayedKnockoutMapToPlayerAsPlayed),
//   knockedOutTeams: many(dbPlayedKnockoutMapToTeamAsKnockedOut),
//   knockedOutPlayers: many(dbPlayedKnockoutMapToPlayerAsKnockedOut)
// }));

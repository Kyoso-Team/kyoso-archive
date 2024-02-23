// import { pgTable, integer, primaryKey, boolean } from 'drizzle-orm/pg-core';
// import {
//   dbStaffMember,
//   dbStaffRole,
//   dbTeam,
//   dbPlayer,
//   dbLobby,
//   dbKnockoutLobby,
//   dbPlayedKnockoutMap,
//   dbPlayedQualMap,
//   dbQualLobby,
//   User,
//   dbNotification
// } from '.';
// import { actions } from '../utils';
// import { relations } from 'drizzle-orm';

// export const dbUserToNotification = pgTable(
//   'user_to_notification',
//   {
//     userId: integer('user_id')
//       .notNull()
//       .references(() => User.id, actions('cascade', 'cascade')),
//     notificationId: integer('notification_id')
//       .notNull()
//       .references(() => dbNotification.id, actions('cascade', 'cascade')),
//     read: boolean('read').notNull().default(false)
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.userId, tbl.notificationId)
//   })
// );

// export const dbUserToNotificationRelations = relations(dbUserToNotification, ({ one }) => ({
//   user: one(User, {
//     fields: [dbUserToNotification.userId],
//     references: [User.id]
//   }),
//   notification: one(dbNotification, {
//     fields: [dbUserToNotification.notificationId],
//     references: [dbNotification.id]
//   })
// }));

// export const dbQualLobbyToTeam = pgTable(
//   'qualifier_lobby_to_team',
//   {
//     qualLobbyId: integer('qualifier_lobby_id')
//       .notNull()
//       .references(() => dbQualLobby.lobbyId, actions('cascade', 'cascade')),
//     teamId: integer('team_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.qualLobbyId, tbl.teamId)
//   })
// );

// export const dbQualLobbyToTeamRelations = relations(dbQualLobbyToTeam, ({ one }) => ({
//   qualLobby: one(dbQualLobby, {
//     fields: [dbQualLobbyToTeam.qualLobbyId],
//     references: [dbQualLobby.lobbyId]
//   }),
//   team: one(dbTeam, {
//     fields: [dbQualLobbyToTeam.teamId],
//     references: [dbTeam.id]
//   })
// }));

// export const dbPlayedQualMapToTeam = pgTable(
//   'played_qualifier_map_to_team',
//   {
//     playedQualMapId: integer('played_qualifier_map_id')
//       .notNull()
//       .references(() => dbPlayedQualMap.id, actions('cascade', 'cascade')),
//     teamId: integer('team_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedQualMapId, tbl.teamId)
//   })
// );

// export const dbPlayedQualMapToTeamRelations = relations(dbPlayedQualMapToTeam, ({ one }) => ({
//   playedQualMap: one(dbPlayedQualMap, {
//     fields: [dbPlayedQualMapToTeam.playedQualMapId],
//     references: [dbPlayedQualMap.id]
//   }),
//   team: one(dbTeam, {
//     fields: [dbPlayedQualMapToTeam.teamId],
//     references: [dbTeam.id]
//   })
// }));

// export const dbKnockoutLobbyToTeam = pgTable(
//   'knockout_lobby_to_team',
//   {
//     knockoutLobbyId: integer('knockout_lobby_id')
//       .notNull()
//       .references(() => dbKnockoutLobby.lobbyId, actions('cascade', 'cascade')),
//     teamId: integer('team_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.knockoutLobbyId, tbl.teamId)
//   })
// );

// export const dbKnockoutLobbyToTeamRelations = relations(dbKnockoutLobbyToTeam, ({ one }) => ({
//   knockoutLobby: one(dbKnockoutLobby, {
//     fields: [dbKnockoutLobbyToTeam.knockoutLobbyId],
//     references: [dbKnockoutLobby.lobbyId]
//   }),
//   team: one(dbTeam, {
//     fields: [dbKnockoutLobbyToTeam.teamId],
//     references: [dbTeam.id]
//   })
// }));

// export const dbPlayedKnockoutMapToTeamAsPlayed = pgTable(
//   'played_knockout_map_to_team_as_played',
//   {
//     playedKnockoutMapId: integer('played_knockout_map_id')
//       .notNull()
//       .references(() => dbPlayedKnockoutMap.id, actions('cascade', 'cascade')),
//     teamId: integer('team_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedKnockoutMapId, tbl.teamId)
//   })
// );

// export const dbPlayedKnockoutMapToTeamAsPlayedRelations = relations(
//   dbPlayedKnockoutMapToTeamAsPlayed,
//   ({ one }) => ({
//     playedKnockoutMap: one(dbPlayedKnockoutMap, {
//       fields: [dbPlayedKnockoutMapToTeamAsPlayed.playedKnockoutMapId],
//       references: [dbPlayedKnockoutMap.id]
//     }),
//     team: one(dbTeam, {
//       fields: [dbPlayedKnockoutMapToTeamAsPlayed.teamId],
//       references: [dbTeam.id]
//     })
//   })
// );

// export const dbPlayedKnockoutMapToTeamAsKnockedOut = pgTable(
//   'played_knockout_map_to_team_as_knocked_out',
//   {
//     playedKnockoutMapId: integer('played_knockout_map_id')
//       .notNull()
//       .references(() => dbPlayedKnockoutMap.id, actions('cascade', 'cascade')),
//     teamId: integer('team_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedKnockoutMapId, tbl.teamId)
//   })
// );

// export const dbPlayedKnockoutMapToTeamAsKnockedOutRelations = relations(
//   dbPlayedKnockoutMapToTeamAsKnockedOut,
//   ({ one }) => ({
//     playedKnockoutMap: one(dbPlayedKnockoutMap, {
//       fields: [dbPlayedKnockoutMapToTeamAsKnockedOut.playedKnockoutMapId],
//       references: [dbPlayedKnockoutMap.id]
//     }),
//     team: one(dbTeam, {
//       fields: [dbPlayedKnockoutMapToTeamAsKnockedOut.teamId],
//       references: [dbTeam.id]
//     })
//   })
// );

// export const dbQualLobbyToPlayer = pgTable(
//   'qualifier_lobby_to_player',
//   {
//     qualLobbyId: integer('qualifier_lobby_id')
//       .notNull()
//       .references(() => dbQualLobby.lobbyId, actions('cascade', 'cascade')),
//     playerId: integer('player_id')
//       .notNull()
//       .references(() => dbPlayer.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.qualLobbyId, tbl.playerId)
//   })
// );

// export const dbQualLobbyToPlayerRelations = relations(dbQualLobbyToPlayer, ({ one }) => ({
//   qualLobby: one(dbQualLobby, {
//     fields: [dbQualLobbyToPlayer.qualLobbyId],
//     references: [dbQualLobby.lobbyId]
//   }),
//   player: one(dbPlayer, {
//     fields: [dbQualLobbyToPlayer.playerId],
//     references: [dbPlayer.id]
//   })
// }));

// export const dbPlayedQualMapToPlayer = pgTable(
//   'played_qualifier_map_to_player',
//   {
//     playedQualMapId: integer('played_qualifier_map_id')
//       .notNull()
//       .references(() => dbPlayedQualMap.id, actions('cascade', 'cascade')),
//     playerId: integer('player_id')
//       .notNull()
//       .references(() => dbTeam.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedQualMapId, tbl.playerId)
//   })
// );

// export const dbPlayedQualMapToPlayerRelations = relations(dbPlayedQualMapToPlayer, ({ one }) => ({
//   playedQualMap: one(dbPlayedQualMap, {
//     fields: [dbPlayedQualMapToPlayer.playedQualMapId],
//     references: [dbPlayedQualMap.id]
//   }),
//   player: one(dbPlayer, {
//     fields: [dbPlayedQualMapToPlayer.playerId],
//     references: [dbPlayer.id]
//   })
// }));

// export const dbKnockoutLobbyToPlayer = pgTable(
//   'knockout_lobby_to_player',
//   {
//     knockoutLobbyId: integer('knockout_lobby_id')
//       .notNull()
//       .references(() => dbKnockoutLobby.lobbyId, actions('cascade', 'cascade')),
//     playerId: integer('player_id')
//       .notNull()
//       .references(() => dbPlayer.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.knockoutLobbyId, tbl.playerId)
//   })
// );

// export const dbKnockoutLobbyToPlayerRelations = relations(dbKnockoutLobbyToPlayer, ({ one }) => ({
//   knockoutLobby: one(dbKnockoutLobby, {
//     fields: [dbKnockoutLobbyToPlayer.knockoutLobbyId],
//     references: [dbKnockoutLobby.lobbyId]
//   }),
//   player: one(dbPlayer, {
//     fields: [dbKnockoutLobbyToPlayer.playerId],
//     references: [dbPlayer.id]
//   })
// }));

// export const dbPlayedKnockoutMapToPlayerAsPlayed = pgTable(
//   'played_knockout_map_to_player_as_played',
//   {
//     playedKnockoutMapId: integer('played_knockout_map_id')
//       .notNull()
//       .references(() => dbPlayedKnockoutMap.id, actions('cascade', 'cascade')),
//     playerId: integer('player_id')
//       .notNull()
//       .references(() => dbPlayer.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedKnockoutMapId, tbl.playerId)
//   })
// );

// export const dbPlayedKnockoutMapToPlayerAsPlayedRelations = relations(
//   dbPlayedKnockoutMapToPlayerAsPlayed,
//   ({ one }) => ({
//     playedKnockoutMap: one(dbPlayedKnockoutMap, {
//       fields: [dbPlayedKnockoutMapToPlayerAsPlayed.playedKnockoutMapId],
//       references: [dbPlayedKnockoutMap.id]
//     }),
//     player: one(dbPlayer, {
//       fields: [dbPlayedKnockoutMapToPlayerAsPlayed.playerId],
//       references: [dbPlayer.id]
//     })
//   })
// );

// export const dbPlayedKnockoutMapToPlayerAsKnockedOut = pgTable(
//   'played_knockout_map_to_player_as_knocked_out',
//   {
//     playedKnockoutMapId: integer('played_knockout_map_id')
//       .notNull()
//       .references(() => dbPlayedKnockoutMap.id, actions('cascade', 'cascade')),
//     playerId: integer('player_id')
//       .notNull()
//       .references(() => dbPlayer.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.playedKnockoutMapId, tbl.playerId)
//   })
// );

// export const dbPlayedKnockoutMapToPlayerAsKnockedOutRelations = relations(
//   dbPlayedKnockoutMapToPlayerAsKnockedOut,
//   ({ one }) => ({
//     playedKnockoutMap: one(dbPlayedKnockoutMap, {
//       fields: [dbPlayedKnockoutMapToPlayerAsKnockedOut.playedKnockoutMapId],
//       references: [dbPlayedKnockoutMap.id]
//     }),
//     player: one(dbPlayer, {
//       fields: [dbPlayedKnockoutMapToPlayerAsKnockedOut.playerId],
//       references: [dbPlayer.id]
//     })
//   })
// );

// export const dbLobbyToStaffMemberAsReferee = pgTable(
//   'lobby_to_staff_member_as_referee',
//   {
//     lobbyId: integer('lobby_id')
//       .notNull()
//       .references(() => dbLobby.id, actions('cascade', 'cascade')),
//     staffMemberId: integer('staff_member_id')
//       .notNull()
//       .references(() => dbStaffMember.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.staffMemberId, tbl.lobbyId)
//   })
// );

// export const dbLobbyToStaffMemberAsRefereeRelations = relations(
//   dbLobbyToStaffMemberAsReferee,
//   ({ one }) => ({
//     lobby: one(dbLobby, {
//       fields: [dbLobbyToStaffMemberAsReferee.lobbyId],
//       references: [dbLobby.id]
//     }),
//     staffMember: one(dbStaffMember, {
//       fields: [dbLobbyToStaffMemberAsReferee.staffMemberId],
//       references: [dbStaffMember.id]
//     })
//   })
// );

// export const dbLobbyToStaffMemberAsStreamer = pgTable(
//   'lobby_to_staff_member_as_streamer',
//   {
//     lobbyId: integer('lobby_id')
//       .notNull()
//       .references(() => dbLobby.id, actions('cascade', 'cascade')),
//     staffMemberId: integer('staff_member_id')
//       .notNull()
//       .references(() => dbStaffMember.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.staffMemberId, tbl.lobbyId)
//   })
// );

// export const dbLobbyToStaffMemberAsStreamerRelations = relations(
//   dbLobbyToStaffMemberAsStreamer,
//   ({ one }) => ({
//     lobby: one(dbLobby, {
//       fields: [dbLobbyToStaffMemberAsStreamer.lobbyId],
//       references: [dbLobby.id]
//     }),
//     staffMember: one(dbStaffMember, {
//       fields: [dbLobbyToStaffMemberAsStreamer.staffMemberId],
//       references: [dbStaffMember.id]
//     })
//   })
// );

// export const dbLobbyToStaffMemberAsCommentator = pgTable(
//   'lobby_to_staff_member_as_commentator',
//   {
//     lobbyId: integer('lobby_id')
//       .notNull()
//       .references(() => dbLobby.id, actions('cascade', 'cascade')),
//     staffMemberId: integer('staff_member_id')
//       .notNull()
//       .references(() => dbStaffMember.id, actions('cascade', 'cascade'))
//   },
//   (tbl) => ({
//     pkey: primaryKey(tbl.staffMemberId, tbl.lobbyId)
//   })
// );

// export const dbLobbyToStaffMemberAsCommentatorRelations = relations(
//   dbLobbyToStaffMemberAsCommentator,
//   ({ one }) => ({
//     lobby: one(dbLobby, {
//       fields: [dbLobbyToStaffMemberAsCommentator.lobbyId],
//       references: [dbLobby.id]
//     }),
//     staffMember: one(dbStaffMember, {
//       fields: [dbLobbyToStaffMemberAsCommentator.staffMemberId],
//       references: [dbStaffMember.id]
//     })
//   })
// );

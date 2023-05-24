import { pgTable, serial, uniqueIndex, varchar, timestamp, boolean, integer, smallint, text, char, real, doublePrecision } from 'drizzle-orm/pg-core';
import { dbTournamentService, dbTournamentType, dbPurchase, dbBanOrder, dbWinCondition, dbPrizeType, dbCashMetric, dbStageFormat, dbMappoolState, dbQualifierRunsSummary, dbMod, dbTournament, dbPooledMap, dbRound, dbTeam, dbPlayer } from '.';
import { timestampConfig, length, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbModMultiplier = pgTable('mod_multipliers', {
  id: serial('id').primaryKey(),
  mods: dbMod('mods').array(4).notNull().default([]),
  value: real('value').notNull(),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  tournamentIdModsKey: uniqueIndex('tournament_id_mods_key').on(tbl.tournamentId, tbl.mods)
}));

export const dbModMultiplierRelations = relations(dbModMultiplier, ({ one }) => ({
  tournament: one(dbTournament, {
    fields: [dbModMultiplier.tournamentId],
    references: [dbTournament.id]
  })
}));

// Total score, average accuracy, average combo, total relative score and total z-score can be calculated using aggregate functions
export const dbTeamScore = pgTable('team_scores', {
  id: serial('id').primaryKey(),
  onPooledMapId: integer('on_pooled_map_id').notNull().references(() => dbPooledMap.id, actions('cascade')),
  roundId: integer('round_id').notNull().references(() => dbRound.id, actions('cascade')),
  teamId: integer('team_id').references(() => dbTeam.id)
});

export const dbTeamScoreRelations = relations(dbTeamScore, ({ one, many }) => ({
  onPooledMap: one(dbPooledMap, {
    fields: [dbTeamScore.onPooledMapId],
    references: [dbPooledMap.id]
  }),
  round: one(dbRound, {
    fields: [dbTeamScore.roundId],
    references: [dbRound.id]
  }),
  team: one(dbTeam, {
    fields: [dbTeamScore.teamId],
    references: [dbTeam.id]
  }),
  playerScores: many(dbPlayerScore)
}));

export const dbPlayerScore = pgTable('player_scores', {
  id: serial('id').primaryKey(),
  score: integer('score').notNull(),
  accuracy: real('accuracy').notNull(),
  combo: smallint('combo').notNull(),
  c300: smallint('count_300').notNull(),
  c100: smallint('count_100').notNull(),
  c50: smallint('count_50').notNull(),
  misses: smallint('misses').notNull(),
  // In case of qualifiers
  relativeScore: doublePrecision('relative_score').notNull().default(0),
  zScore: doublePrecision('z_score').notNull().default(0),
  mods: dbMod('mods').array(4).notNull().default([]),
  onPooledMapId: integer('on_pooled_map_id').notNull().references(() => dbPooledMap.id, actions('cascade')),
  roundId: integer('round_id').notNull().references(() => dbRound.id, actions('cascade')),
  teamScoreId: integer('team_score_id').notNull().references(() => dbTeamScore.id, actions('cascade')),
  playerId: integer('player_id').references(() => dbPlayer.id)
});

export const dbPlayerScoreRelations = relations(dbPlayerScore, ({ one }) => ({
  onPooledMap: one(dbPooledMap, {
    fields: [dbPlayerScore.onPooledMapId],
    references: [dbPooledMap.id]
  }),
  round: one(dbRound, {
    fields: [dbPlayerScore.roundId],
    references: [dbRound.id]
  }),
  player: one(dbPlayer, {
    fields: [dbPlayerScore.playerId],
    references: [dbPlayer.id]
  }),
  teamScore: one(dbTeamScore, {
    fields: [dbPlayerScore.teamScoreId],
    references: [dbTeamScore.id]
  })
}));

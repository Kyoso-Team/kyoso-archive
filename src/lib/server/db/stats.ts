// import {
//   pgTable,
//   serial,
//   integer,
//   smallint,
//   real,
//   doublePrecision,
//   unique
// } from 'drizzle-orm/pg-core';
// import { dbMod, dbTournament, dbPooledMap, dbRound, dbTeam, dbPlayer } from '.';
// import { actions } from '../utils';
// import { relations } from 'drizzle-orm';

// export const dbModMultiplier = pgTable(
//   'mod_multiplier',
//   {
//     id: serial('id').primaryKey(),
//     mods: dbMod('mods').array(4).notNull().default([]),
//     value: real('value').notNull(),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade'))
//   },
//   (tbl) => ({
//     tournamentIdModsKey: unique('mod_multiplier_tournament_id_mods_key').on(
//       tbl.tournamentId,
//       tbl.mods
//     )
//   })
// );

// // Total score, average accuracy, average combo, total relative score and total z-score can be calculated using aggregate functions
// export const dbTeamScore = pgTable('team_score', {
//   id: serial('id').primaryKey(),
//   pooledMapId: integer('on_pooled_map_id')
//     .notNull()
//     .references(() => dbPooledMap.id, actions('cascade')),
//   roundId: integer('round_id')
//     .notNull()
//     .references(() => dbRound.id, actions('cascade')),
//   teamId: integer('team_id').references(() => dbTeam.id)
// });

// // TODO once Drizzle supports more features: Move accuracy, relativeScore and zScore to a materialized view
// export const dbPlayerScore = pgTable('player_score', {
//   id: serial('id').primaryKey(),
//   score: integer('score').notNull(),
//   accuracy: real('accuracy').notNull(),
//   combo: smallint('combo').notNull(),
//   c300: smallint('count_300').notNull(),
//   c100: smallint('count_100').notNull(),
//   c50: smallint('count_50').notNull(),
//   misses: smallint('misses').notNull(),
//   // In case of qualifiers
//   relativeScore: doublePrecision('relative_score').notNull().default(0),
//   zScore: doublePrecision('z_score').notNull().default(0),
//   mods: dbMod('mods').array(4).notNull().default([]),
//   pooledMapId: integer('on_pooled_map_id')
//     .notNull()
//     .references(() => dbPooledMap.id, actions('cascade')),
//   roundId: integer('round_id')
//     .notNull()
//     .references(() => dbRound.id, actions('cascade')),
//   teamScoreId: integer('team_score_id')
//     .notNull()
//     .references(() => dbTeamScore.id, actions('cascade')),
//   playerId: integer('player_id').references(() => dbPlayer.id)
// });

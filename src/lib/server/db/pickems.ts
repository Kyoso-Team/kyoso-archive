// import { pgTable, serial, timestamp, integer, smallint, unique } from 'drizzle-orm/pg-core';
// import {
//   User,
//   dbTournament,
//   dbOpponent,
//   dbMatch,
//   dbTeam,
//   dbRound,
//   dbPotentialMatch,
//   dbPlayer
// } from '.';
// import { timestampConfig, actions } from '../utils';
// import { relations } from 'drizzle-orm';

// export const dbPickemUser = pgTable(
//   'pickem_user',
//   {
//     id: serial('id').primaryKey(),
//     points: smallint('points').notNull().default(0),
//     userId: integer('user_id')
//       .notNull()
//       .references(() => User.id, actions('cascade')),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade'))
//   },
//   (tbl) => ({
//     userIdTournamentIdKey: unique('pickem_user_user_id_tournament_id_key').on(
//       tbl.userId,
//       tbl.tournamentId
//     )
//   })
// );

// export const dbPredictionSubmission = pgTable(
//   'prediction_submission',
//   {
//     id: serial('id').primaryKey(),
//     submittedAt: timestamp('submitted_at', timestampConfig).notNull().defaultNow(),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     roundId: integer('round_id')
//       .notNull()
//       .references(() => dbRound.id, actions('cascade')),
//     submittedByPickemUserId: integer('submitted_by_pickem_user_id')
//       .notNull()
//       .references(() => dbPickemUser.id, actions('cascade'))
//   },
//   (tbl) => ({
//     roundIdSubmittedByPickemUserIdKey: unique(
//       'prediction_submission_round_id_submitted_by_pickem_user_id_key'
//     ).on(tbl.roundId, tbl.submittedByPickemUserId)
//   })
// );

// export const dbMatchPrediction = pgTable(
//   'match_prediction',
//   {
//     id: serial('id').primaryKey(),
//     predictedWinner: dbOpponent('predicted_winner').notNull(),
//     matchId: integer('match_id')
//       .notNull()
//       .references(() => dbMatch.lobbyId, actions('cascade')),
//     submissionId: integer('submission_id')
//       .notNull()
//       .references(() => dbPredictionSubmission.id, actions('cascade'))
//   },
//   (tbl) => ({
//     matchIdSubmissionIdKey: unique('match_prediction_match_id_submission_id_key').on(
//       tbl.matchId,
//       tbl.submissionId
//     )
//   })
// );

// export const dbPotentialMatchPrediction = pgTable(
//   'potential_match_prediction',
//   {
//     id: serial('id').primaryKey(),
//     predictedWinner: dbOpponent('predicted_winner').notNull(),
//     potentialMatchId: integer('potential_match_id')
//       .notNull()
//       .references(() => dbPotentialMatch.id, actions('cascade')),
//     submissionId: integer('submission_id')
//       .notNull()
//       .references(() => dbPredictionSubmission.id, actions('cascade'))
//   },
//   (tbl) => ({
//     potentialMatchIdSubmissionIdKey: unique(
//       'potential_match_prediction_potential_match_id_submission_id_key'
//     ).on(tbl.potentialMatchId, tbl.submissionId)
//   })
// );

// export const dbQualPrediction = pgTable('qualifier_predictions', {
//   id: serial('id').primaryKey(),
//   predictedPosition: smallint('predicted_position').notNull(),
//   submissionId: integer('submission_id')
//     .notNull()
//     .references(() => dbPredictionSubmission.id, actions('cascade')),
//   // Solo and draft
//   playerId: integer('player_id').references(() => dbPlayer.id),
//   // Teams
//   teamId: integer('team_id').references(() => dbTeam.id)
// });

import { pgTable, serial, uniqueIndex, varchar, timestamp, boolean, integer, smallint, text, char, real } from 'drizzle-orm/pg-core';
import { dbTournamentService, dbTournamentType, dbPurchase, dbBanOrder, dbWinCondition, dbPrizeType, dbCashMetric, dbStageFormat, dbMappoolState, dbQualifierRunsSummary, dbLobby, dbModpool, dbPickemUser, dbPlayer, dbPlayerScore, dbPooledMap, dbPotentialMatch, dbPredictionSubmission, dbRoundPublicationNotif, dbStaffMember, dbStaffRole, dbSuggestedMap, dbTeam, dbTeamScore, dbModMultiplier } from '.';
import { timestampConfig, length, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbTournament = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(50)).notNull(),
  acronym: varchar('acronym', length(8)).notNull(),
  /* when lowerRankRange and upperRankRange are set to -1, then the tournament is open rank */
  lowerRankRange: integer('lower_rank_range').notNull(),
  upperRankRange: integer('upper_rank_range').notNull(), // Date in which the tournament will be displayed on the site for anyone to view
  goPublicOn: timestamp('go_public_on', timestampConfig), // Date in which the tournament can no longer be modified (its settings, pools, schedules, etc.)
  concludesOn: timestamp('concludes_on', timestampConfig),
  playerRegsOpenOn: timestamp('player_regs_open_on', timestampConfig),
  playerRegsCloseOn: timestamp('player_regs_close_on', timestampConfig),
  staffRegsOpenOn: timestamp('staff_regs_open_on', timestampConfig),
  staffRegsCloseOn: timestamp('staff_regs_close_on', timestampConfig),
  teamSize: smallint('team_size').notNull().default(1),
  teamPlaySize: smallint('team_play_size').notNull().default(1),
  hasBanner: boolean('has_banner').default(false),
  useBWS: boolean('use_bws').notNull(),
  rules: text('rules'), // Markdown
  type: dbTournamentType('type').notNull(),
  services: dbTournamentService('services').array(dbTournamentService.enumValues.length).notNull().default([]),
  // Links
  forumPostId: integer('forum_post_id'),
  discordInviteId: varchar('discord_invite_id', length(12)),
  mainSheetId: varchar('main_sheet_id', length(45)),
  twitchChannelName: varchar('twitch_channel_name', length(25)),
  youtubeChannelId: varchar('youtube_channel_id', length(25)),
  twitterHandle: varchar('twitter_handle', length(15)),
  donationLink: varchar('donation_link', length(100)),
  websiteLink: varchar('website_link', length(100)),
  // Referee settings
  pickTimerLength: smallint('pick_timer_length').notNull().default(120),
  startTimerLength: smallint('start_timer_length').notNull().default(10),
  doublePickAllowed: boolean('double_pick_allowed').notNull().default(false),
  doubleBanAllowed: boolean('double_ban_allowed').notNull().default(false),
  alwaysForceNoFail: boolean('always_force_nofail').notNull().default(true),
  rollRules: text('roll_rules'),
  freeModRules: text('free_mod_rules'),
  warmupRules: text('warmup_rules'),
  lateProcedures: text('late_procedures'),
  banOrder: dbBanOrder('ban_order').notNull().default('ABABAB'),
  winCondition: dbWinCondition('win_condition').notNull().default('score')
}, (tbl) => ({
  nameKey: uniqueIndex('name_key').on(tbl.name)
}));

export const dbTournamentRelations = relations(dbTournament, ({ many }) => ({
  staffRoles: many(dbStaffRole),
  staffMembers: many(dbStaffMember),
  inPurchases: many(dbPurchase),
  modMultipliers: many(dbModMultiplier),
  stages: many(dbStage),
  rounds: many(dbRound),
  suggestedMaps: many(dbSuggestedMap),
  pooledMaps: many(dbPooledMap),
  lobbies: many(dbLobby),
  teams: many(dbTeam),
  players: many(dbPlayer),
  potentialMatches: many(dbPotentialMatch),
  pickemUsers: many(dbPickemUser),
  predictionSubmissions: many(dbPredictionSubmission),
  prizes: many(dbPrize)
}));

export const dbPrize = pgTable('prizes', {
  id: serial('id').primaryKey(),
  type: dbPrizeType('type').notNull(),
  positions: smallint('positons').array().notNull().default([]), // A single element array for a single place. Example: 1st, 2nd, 3rd place
  // A range of positions in case of multiple placements sharing the same prize. Example: Top 4-6
  trophy: boolean('trophy').notNull(),
  medal: boolean('medal').notNull(),
  badge: boolean('badge').notNull(),
  banner: boolean('banner').notNull(),
  additionalItems: varchar('additional_items', length(25)).array().notNull().default([]),
  monthsOsuSupporter: smallint('months_osu_supporter'),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
});

export const dbPrizeRelations = relations(dbPrize, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbPrize.tournamentId],
    references: [dbTournament.id]
  }),
  awardedToPlayers: many(dbPlayer),
  awardedToTeams: many(dbTeam),
  awardedToPickemUsers: many(dbPickemUser)
}));

export const dbPrizeCash = pgTable('prize_cash', {
  value: real('value').notNull(),
  metric: dbCashMetric('metric').notNull(),
  currency: char('currency', length(3)).notNull(),
  inPrizeId: integer('in_prize_id').primaryKey().references(() => dbPrize.id)
});

export const dbPrizeCashRelations = relations(dbPrizeCash, ({ one }) => ({
  inPrize: one(dbPrize, {
    fields: [dbPrizeCash.inPrizeId],
    references: [dbPrize.id]
  })
}));

export const dbStage = pgTable('stages', {
  id: serial('id').primaryKey(),
  format: dbStageFormat('format').notNull(),
  order: smallint('order').notNull(),
  isMainStage: boolean('is_main_stage').notNull().default(false),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  tournamentIdFormatKey: uniqueIndex('tournament_id_format_key').on(tbl.tournamentId, tbl.format)
}));

export const dbStageRelations = relations(dbStage, ({ one, many }) => ({
  tournament: one(dbTournament, {
    fields: [dbStage.tournamentId],
    references: [dbTournament.id]
  }),
  rounds: many(dbRound)
}));

export const dbRound = pgTable('rounds', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(20)).notNull(),
  order: smallint('order').notNull(),
  targetStarRating: real('target_star_rating'),
  mappoolState: dbMappoolState('mappool_state').notNull().default('private'),
  publishSchedules: boolean('publish_schedules').notNull().default(false),
  publishStats: boolean('publish_stats').notNull().default(false),
  stageId: integer('stage_id').notNull().references(() => dbStage.id, actions('cascade')),
  tournamentId: integer('tournament_id').notNull().references(() => dbTournament.id, actions('cascade'))
}, (tbl) => ({
  nameTournamentIdKey: uniqueIndex('name_tournament_id_key').on(tbl.name, tbl.tournamentId)
}));

export const dbRoundRelations = relations(dbRound, ({ many }) => ({
  modpools: many(dbModpool),
  suggestedMaps: many(dbSuggestedMap),
  pooledMaps: many(dbPooledMap),
  lobbies: many(dbLobby),
  teamScores: many(dbTeamScore),
  playerScores: many(dbPlayerScore),
  inRoundPublicationNotifs: many(dbRoundPublicationNotif),
  inPredictionSubmissions: many(dbPredictionSubmission)
}));

// Applies to: Groups, swiss, single and double elim.
export const dbStandardRound = pgTable('standard_rounds', {
  bestOf: smallint('best_of').notNull(),
  banCount: smallint('ban_count').notNull(),
  roundId: integer('round_id').primaryKey().references(() => dbRound.id, actions('cascade'))
}, (tbl) => ({
  roundIdKey: uniqueIndex('round_id_key').on(tbl.roundId)
}));

export const dbStandardRoundRelations = relations(dbStandardRound, ({ one }) => ({
  round: one(dbRound, {
    fields: [dbStandardRound.roundId],
    references: [dbRound.id]
  })
}));

export const dbQualifierRound = pgTable('qualifier_rounds', {
  publishMpLinks: boolean('publish_mp_links').notNull().default(false),
  runCount: smallint('run_count').notNull(), // How many times will the mappool be played
  summarizeRunsAs: dbQualifierRunsSummary('summarize_runs_as').notNull().default('average'),
  roundId: integer('round_id').primaryKey().references(() => dbRound.id, actions('cascade'))
}, (tbl) => ({
  roundIdKey: uniqueIndex('round_id_key').on(tbl.roundId)
}));

export const dbQualifierRoundRelations = relations(dbQualifierRound, ({ one }) => ({
  round: one(dbRound, {
    fields: [dbQualifierRound.roundId],
    references: [dbRound.id]
  })
}));

export const dbBattleRoyaleRound = pgTable('battle_royale_rounds', {
  playersEliminatedPerMap: smallint('players_eliminated_per_map').notNull(),
  roundId: integer('round_id').primaryKey().references(() => dbRound.id, actions('cascade'))
}, (tbl) => ({
  roundIdKey: uniqueIndex('round_id_key').on(tbl.roundId)
}));

export const dbBattleRoyaleRoundRelations = relations(dbBattleRoyaleRound, ({ one }) => ({
  round: one(dbRound, {
    fields: [dbBattleRoyaleRound.roundId],
    references: [dbRound.id]
  })
}));

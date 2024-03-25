import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  jsonb,
  smallint,
  boolean,
  unique,
  real,
  timestamp,
  uniqueIndex,
  date,
  index
} from 'drizzle-orm/pg-core';
import { StageFormat, TournamentType } from './schema';
import { timestampConfig, uniqueConstraints, citext } from './schema-utils';
import type {
  BWSValues,
  RankRange,
  RefereeSettings,
  RoundConfig,
  TeamSettings,
  TournamentOtherDates,
  TournamentLink
} from '$types';

export const Tournament = pgTable(
  'tournament',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at', timestampConfig).notNull().defaultNow(),
    deleted: boolean('deleted').notNull().default(false),
    name: citext('name').notNull().unique(uniqueConstraints.tournament.name),
    urlSlug: varchar('url_slug', {
      length: 16
    }).notNull(),
    acronym: varchar('acronym', {
      length: 8
    }).notNull(),
    type: TournamentType('type').notNull(),
    /** Written as Markdown */
    rules: text('rules'),
    logoMetadata: jsonb('logo_metadata').$type<{
      fileId: string;
      originalFileName: string;
    }>(),
    bannerMetadata: jsonb('banner_metadata').$type<{
      fileId: string;
      originalFileName: string;
    }>(),
    /** If null, then it's an open rank tournament */
    rankRange: jsonb('rank_range').$type<RankRange>(),
    publishedAt: timestamp('published_at', { mode: 'string' }),
    concludesAt: timestamp('concludes_at', { mode: 'string' }),
    playerRegsOpenAt: date('player_regs_open_at', { mode: 'string' }),
    playerRegsCloseAt: date('player_regs_close_at', { mode: 'string' }),
    staffRegsOpenAt: date('staff_regs_open_at', { mode: 'string' }),
    staffRegsCloseAt: date('staff_regs_close_at', { mode: 'string' }),
    otherDates: jsonb('other_dates').notNull().$type<TournamentOtherDates[]>().default([]),
    teamSettings: jsonb('team_settings').$type<TeamSettings>(),
    /** If null, then the tournament doesn't use BWS */
    bwsValues: jsonb('bws_values').$type<BWSValues>(),
    links: jsonb('links').notNull().$type<TournamentLink[]>().default([]),
    refereeSettings: jsonb('referee_settings')
      .notNull()
      .$type<RefereeSettings>()
      .default({
        timerLength: {
          pick: 120,
          ban: 120,
          protect: 120,
          ready: 120,
          start: 10
        },
        allow: {
          doublePick: false,
          doubleBan: false,
          doubleProtect: false
        },
        order: {
          ban: 'linear',
          pick: 'linear',
          protect: 'linear'
        },
        alwaysForceNoFail: true,
        banAndProtectCancelOut: false,
        winCondition: 'score'
      })
  },
  (table) => ({
    uniqueIndexUrlSlug: uniqueIndex(uniqueConstraints.tournament.urlSlug).on(table.urlSlug),
    indexPublishedAt: index('idx_tournament_published_at').on(table.publishedAt),
    indexConcludesAt: index('idx_tournament_concludes_at').on(table.concludesAt),
    indexPlayerRegsOpenAt: index('idx_tournament_player_regs_open_at').on(table.playerRegsOpenAt),
    indexPlayerRegsCloseAt: index('idx_tournament_player_regs_close_at').on(
      table.playerRegsCloseAt
    ),
    indexStaffRegsOpenAt: index('idx_tournament_staff_regs_open_at').on(table.staffRegsOpenAt),
    indexStaffRegsCloseAt: index('idx_tournament_staff_regs_close_at').on(table.staffRegsCloseAt)
  })
);

export const Stage = pgTable(
  'stage',
  {
    id: serial('id').primaryKey(),
    format: StageFormat('format').notNull(),
    order: smallint('order').notNull(),
    isMainStage: boolean('is_main_stage').notNull().default(false),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    uniqueTournamentIdFormat: unique('uni_stage_tournament_id_format').on(
      table.tournamentId,
      table.format
    )
  })
);

export const Round = pgTable(
  'round',
  {
    id: serial('id').primaryKey(),
    name: citext('name').notNull(),
    order: smallint('order').notNull(),
    targetStarRating: real('target_star_rating').notNull(),
    playtestingPool: boolean('playtesting_pool').notNull().default(false),
    publishPool: boolean('publish_pool').notNull().default(false),
    publishSchedules: boolean('publish_schedules').notNull().default(false),
    publishStats: boolean('publish_stats').notNull().default(false),
    config: jsonb('config').notNull().$type<RoundConfig>(),
    stageId: integer('stage_id')
      .notNull()
      .references(() => Stage.id, {
        onDelete: 'cascade'
      }),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    uniqueNameTournamentId: unique('uni_round_name_tournament_id').on(
      table.name,
      table.tournamentId
    )
  })
);

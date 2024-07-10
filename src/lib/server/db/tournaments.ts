import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';
import { RoundType, TournamentType } from './schema';
import { timestampConfig, uniqueConstraints } from './schema-utils';
import { sql } from 'drizzle-orm';
import type {
  BWSValues,
  ModMultiplier,
  RankRange,
  RefereeSettings,
  RoundConfig,
  TeamSettings,
  TournamentLink,
  TournamentOtherDates,
  TournamentTheme
} from '$types';

export const Tournament = pgTable(
  'tournament',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at', timestampConfig).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', timestampConfig),
    name: varchar('name', { length: 50 }).notNull().unique(uniqueConstraints.tournament.name),
    description: varchar('description', { length: 150 }),
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
    teamSettings: jsonb('team_settings').$type<TeamSettings>(),
    /** If null, then the tournament doesn't use BWS */
    bwsValues: jsonb('bws_values').$type<BWSValues>(),
    /** Limit of 5 mod multipliers */
    modMultipliers: jsonb('mod_multipliers').notNull().$type<ModMultiplier[]>().default([]),
    /** Limit of 20 links */
    links: jsonb('links').notNull().$type<TournamentLink[]>().default([]),
    theme: jsonb('theme').$type<TournamentTheme>(),
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
    indexDeletedAt: index('idx_tournament_deleted_at').on(table.deletedAt),
    indexNameAcronymUrlSlug: index('idx_trgm_tournament_name_acronym').using(
      'gist',
      sql`lower(${table.name}) || ' ' || lower(${table.acronym}) gist_trgm_ops`
    ),
    uniqueIndexUrlSlug: uniqueIndex(uniqueConstraints.tournament.urlSlug).on(table.urlSlug)
  })
);

export const TournamentDates = pgTable(
  'tournament_dates',
  {
    tournamentId: integer('tournament_id')
      .primaryKey()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      }),
    publishedAt: timestamp('published_at', timestampConfig),
    concludesAt: timestamp('concludes_at', timestampConfig),
    playerRegsOpenAt: timestamp('player_regs_open_at', timestampConfig),
    playerRegsCloseAt: timestamp('player_regs_close_at', timestampConfig),
    staffRegsOpenAt: timestamp('staff_regs_open_at', timestampConfig),
    staffRegsCloseAt: timestamp('staff_regs_close_at', timestampConfig),
    /** Limit of 20 other dates */
    other: jsonb('other').notNull().$type<TournamentOtherDates[]>().default([])
  },
  (table) => ({
    indexPublishedAt: index('idx_tournament_dates_published_at').on(table.publishedAt.desc()),
    indexConcludesAt: index('idx_tournament_dates_concludes_at').on(table.concludesAt),
    indexPlayerRegsOpenAtPlayerRegsCloseAt: index(
      'idx_tournament_dates_player_regs_open_at_player_regs_close_at'
    ).on(table.playerRegsOpenAt, table.playerRegsCloseAt),
    indexStaffRegsOpenAtStaffRegsCloseAt: index(
      'idx_tournament_dates_staff_regs_open_at_regs_close_at'
    ).on(table.staffRegsOpenAt, table.staffRegsCloseAt)
  })
);

export const Round = pgTable(
  'round',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 20 }).notNull(),
    deletedAt: timestamp('deleted_at', timestampConfig),
    type: RoundType('type').notNull(),
    order: smallint('order').notNull(),
    targetStarRating: real('target_star_rating'),
    playtestingPool: boolean('playtesting_pool').notNull().default(false),
    publishPoolAt: timestamp('publish_pool_at', timestampConfig),
    publishSchedulesAt: timestamp('publish_schedules_at', timestampConfig),
    publishStatsAt: timestamp('publish_stats_at', timestampConfig),
    config: jsonb('config').notNull().$type<RoundConfig>(),
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
    ),
    indexTournamentIdDeletedAtOrder: index('idx_round_tournament_id_deleted_at_order').on(
      table.tournamentId,
      table.deletedAt,
      table.order
    )
  })
);

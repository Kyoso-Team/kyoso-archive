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
  real
} from 'drizzle-orm/pg-core';
import { StageFormat, TournamentAsset, TournamentType } from '.';
import type { BWSValues, RefereeSettings, RoundConfig, TeamSettings, TournamentDates, TournamentLink } from '$types';

export const Tournament = pgTable('tournament', {
  id: serial('id').primaryKey(),
  name: varchar('name', {
    length: 50
  }).notNull().unique('uni_tournament_name'),
  urlSlug: varchar('url_slug', {
    length: 16
  }).notNull().unique('uni_tournament_url_slug'),
  acronym: varchar('acronym', {
    length: 8
  }).notNull(),
  type: TournamentType('type').notNull(),
  /** First element is lower rank range, and last element is upper rank range. If null, then it's an open rank tournament */
  rankRange: integer('rank_range').array(2),
  /** Written as Markdown */
  rules: text('rules'),
  dates: jsonb('dates').notNull().$type<TournamentDates>().default({
    other: []
  }),
  teamSettings: jsonb('team_settings').$type<TeamSettings>(),
  /** If null, then the tournament doesn't use BWS */
  bwsValues: jsonb('bws_values').$type<BWSValues>(),
  links: jsonb('links').notNull().$type<TournamentLink[]>().default([]),
  assets: TournamentAsset('assets').array().notNull().default([]),
  refereeSettings: jsonb('referee_settings').notNull().$type<RefereeSettings>().default({
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
});

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
    uniqueTournamentIdFormat: unique('uni_stage_tournament_id_format').on(table.tournamentId, table.format)
  })
);

export const Round = pgTable(
  'round',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', {
      length: 20
    }).notNull(),
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
    uniqueNameTournamentId: unique('uni_round_name_tournament_id').on(table.name, table.tournamentId)
  })
);

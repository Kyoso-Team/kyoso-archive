// import {
//   pgTable,
//   serial,
//   varchar,
//   boolean,
//   integer,
//   smallint,
//   text,
//   real,
//   numeric,
//   unique
// } from 'drizzle-orm/pg-core';
// import {
//   dbMod,
//   dbSkillset,
//   dbRound,
//   dbStaffMember,
//   dbTournament,
//   dbPlayedMap,
//   dbPlayedKnockoutMap,
//   dbBannedMap,
//   dbPlayedQualMap,
//   dbPlayerScore,
//   dbTeamScore
// } from '.';
// import { length, actions } from '../utils';
// import { relations } from 'drizzle-orm';

// export const dbModpool = pgTable(
//   'modpool',
//   {
//     id: serial('id').primaryKey(),
//     category: varchar('category', length(3)).notNull(), // "NM", "HD", "TB", etc.
//     mods: dbMod('mods').array(4).notNull().default([]),
//     isFreeMod: boolean('is_free_mod').notNull(),
//     isTieBreaker: boolean('is_tie_breaker').notNull(),
//     order: smallint('order').notNull(), // The order in which the modpools should be presented. Example: NM (1) should go before HD (2)
//     mapCount: smallint('map_count').notNull(),
//     roundId: integer('round_id')
//       .notNull()
//       .references(() => dbRound.id, actions('cascade'))
//   },
//   (tbl) => ({
//     roundIdCategoryKey: unique('modpool_round_id_category_key').on(tbl.roundId, tbl.category)
//   })
// );

// export const dbBeatmapset = pgTable('beatmapset', {
//   osuBeatmapsetId: integer('osu_beatmapset_id').primaryKey(),
//   artist: varchar('artist', length(70)).notNull(),
//   title: varchar('title', length(180)).notNull(), // https://youtu.be/LnkfOVHkVfo
//   mapperId: integer('mapper_id')
//     .notNull()
//     .references(() => dbMapper.osuUserId, actions('cascade'))
// });

// export const dbMapper = pgTable('mapper', {
//   osuUserId: integer('osu_user_id').primaryKey(),
//   username: varchar('username', length(16)).notNull()
// });

// export const dbBeatmap = pgTable('beatmap', {
//   osuBeatmapId: integer('osu_beatmap_id').primaryKey(),
//   diffName: varchar('difficulty_name', length(75)).notNull(),
//   maxCombo: smallint('max_combo').notNull(),
//   // Stats are presented without mods
//   bpm: real('bpm').notNull(),
//   length: real('length').notNull(), // In seconds
//   cs: real('circle_size').notNull(),
//   ar: real('approach_rate').notNull(),
//   od: real('overall_difficulty').notNull(),
//   hp: real('health_points').notNull(),
//   beatmapsetId: integer('beatmapset_id')
//     .notNull()
//     .references(() => dbBeatmapset.osuBeatmapsetId, actions('cascade'))
// });

// // Star rating is kept in DB because it can't be calculated with the data the osu! API provides
// export const dbStarRating = pgTable(
//   'star_rating',
//   {
//     id: serial('id').primaryKey(),
//     mods: dbMod('mods').array(4).notNull().default([]),
//     value: real('value').notNull(),
//     beatmapId: integer('beatmap_id')
//       .notNull()
//       .references(() => dbBeatmap.osuBeatmapId, actions('cascade'))
//   },
//   (tbl) => ({
//     modsBeatmapIdKey: unique('star_rating_mods_beatmap_id_key').on(tbl.mods, tbl.beatmapId)
//   })
// );

// export const dbSuggestedMap = pgTable(
//   'suggested_map',
//   {
//     id: serial('id').primaryKey(),
//     suggestedSkillsets: dbSkillset('suggested_skillset').array(3).notNull().default([]),
//     suggesterComment: text('suggester_comment'),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     roundId: integer('round_id')
//       .notNull()
//       .references(() => dbRound.id, actions('cascade')),
//     modpoolId: integer('modpool_id')
//       .notNull()
//       .references(() => dbModpool.id, actions('cascade')),
//     beatmapId: integer('beatmap_id')
//       .notNull()
//       .references(() => dbBeatmap.osuBeatmapId, actions('cascade')),
//     suggestedByStaffMemberId: integer('suggested_by_staff_member_id').references(
//       () => dbStaffMember.id
//     )
//   },
//   (tbl) => ({
//     beatmapIdModpoolIdKey: unique('suggested_map_beatmap_id_modpool_id_key').on(
//       tbl.beatmapId,
//       tbl.modpoolId
//     )
//   })
// );

// export const dbPooledMap = pgTable(
//   'pooled_map',
//   {
//     id: serial('id').primaryKey(),
//     slot: smallint('slot').notNull(), // Position in modpool. Example: If slot is 1 and modpool is NM then: NM1,
//     skillsets: dbSkillset('skillsets').array(3).notNull().default([]),
//     poolerComment: text('pooler_comment'),
//     hasBeatmapFile: boolean('has_beatmap_file').notNull().default(false),
//     hasReplay: boolean('has_replay').notNull().default(false),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     roundId: integer('round_id')
//       .notNull()
//       .references(() => dbRound.id, actions('cascade')),
//     modpoolId: integer('modpool_id')
//       .notNull()
//       .references(() => dbModpool.id, actions('cascade')),
//     beatmapId: integer('beatmap_id')
//       .notNull()
//       .references(() => dbBeatmap.osuBeatmapId, actions('cascade')),
//     suggestedByStaffMemberId: integer('suggested_by_staff_member_id').references(
//       () => dbStaffMember.id
//     ),
//     pooledByStaffMemberId: integer('pooled_by_staff_member_id').references(() => dbStaffMember.id)
//   },
//   (tbl) => ({
//     modpoolIdBeatmapIdKey: unique('pooled_map_modpool_id_beatmap_id_key').on(
//       tbl.modpoolId,
//       tbl.beatmapId
//     )
//   })
// );

// export const dbPooledMapRating = pgTable(
//   'pooled_map_rating',
//   {
//     id: serial('id').primaryKey(),
//     rating: numeric('rating', {
//       precision: 3,
//       scale: 1
//     }).notNull(), // Enjoyment rating from a scale of 0 to 10
//     pooledMapId: integer('pooled_map_id')
//       .notNull()
//       .references(() => dbPooledMap.id, actions('cascade')),
//     ratedById: integer('rated_by_id').references(() => dbStaffMember.id)
//   },
//   (tbl) => ({
//     ratedByIdPooledByIdKey: unique('pooled_map_rating_rated_by_id_pooled_by_id_key').on(
//       tbl.ratedById,
//       tbl.pooledMapId
//     )
//   })
// );

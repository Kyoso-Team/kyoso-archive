import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  char,
  primaryKey
} from 'drizzle-orm/pg-core';
import { timestampConfig } from '../utils';

export const User = pgTable('user', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  updatedApiDataAt: timestamp('updated_api_data_at', timestampConfig).notNull().defaultNow(),
  isAdmin: boolean('is_admin').notNull().default(false),
  apiKey: varchar('api_key', {
    length: 24
  }).notNull().unique('uni_user_api_key'),
  // Relations
  osuUserId: integer('osu_user_id').notNull().unique('uni_user_osu_user_id').references(() => OsuUser.osuUserId),
  discordUserId: varchar('discord_user_id', {
    length: 19
  }).notNull().unique('uni_user_discord_user_id').references(() => DiscordUser.discordUserId)
}); 

export const OsuUser = pgTable('osu_user', {
  osuUserId: integer('osu_user_id').primaryKey(),
  username: varchar('username', {
    length: 16
  }).notNull().unique('uni_osu_user_username'),
  isRestricted: boolean('is_restricted').notNull(),
  globalStdRank: integer('global_std_rank'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  countryCode: char('code', {
    length: 2
  })
    .notNull()
    .references(() => Country.code)
});

export const OsuBadge = pgTable('osu_badge', {
  /** Example: In URL `https://assets.ppy.sh/profile-badges/owc2023-winner.png`, `owc2023-winner.png` is the file name */
  imgFileName: varchar('img_file_name', {
    length: 60
  }).primaryKey(),
  description: text('description')
});

export const OsuUserAwardedBadge = pgTable('osu_user_awarded_badge', {
  osuUserId: integer('osu_user_id').notNull().references(() => OsuUser.osuUserId),
  osuBadgeImgFileName: varchar('osu_badge_img_file_name', {
    length: 60
  }).notNull().references(() => OsuBadge.imgFileName),
  awardedAt: timestamp('awarded_at', timestampConfig).notNull()
}, (table) => ({
  pk: primaryKey({
    columns: [table.osuUserId, table.osuBadgeImgFileName]
  })
}));

export const Country = pgTable('country', {
  code: char('code', {
    length: 2
  }).primaryKey(),
  name: varchar('name', {
    length: 35
  }).notNull()
});

export const DiscordUser = pgTable('discord_user', {
  discordUserId: varchar('discord_user_id', {
    length: 19
  }).primaryKey(),
  username: varchar('username', {
    length: 32
  }).notNull(),
  accesstoken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull()
});

// export const dbUserPlayerInfo = pgTable('user_player_info', {
//   updatedAt: timestamp('updated_at', timestampConfig).notNull().defaultNow(),
//   /**
//    * A string that represents the availability between 0 - 23 UTC (24 digits), from Friday to Monday.
//    * Where each digit can be either 0 (unavailable) or 1 (available).
//    * Each day is separated by a period, similarly to an IP address
//    */
//   availability: char('availability', length(99)).notNull(),
//   badgeCount: integer('badge_count').notNull(),
//   userId: integer('user_id')
//     .notNull()
//     .primaryKey()
//     .references(() => dbUser.id, actions('cascade'))
// });

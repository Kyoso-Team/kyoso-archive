import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  char,
  primaryKey,
  inet,
  jsonb,
  bigserial,
  index,
  bigint,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { timestampConfig } from './schema-utils';
import type { OAuthToken } from '$types';

export const User = pgTable('user', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  updatedApiDataAt: timestamp('updated_api_data_at', timestampConfig).notNull().defaultNow(),
  admin: boolean('admin').notNull().default(false),
  approvedHost: boolean('approved_host').notNull().default(false),
  apiKey: varchar('api_key', {
    length: 24
  }).unique('uni_user_api_key'),
  // Relations
  osuUserId: integer('osu_user_id').notNull().references(() => OsuUser.osuUserId),
  discordUserId: varchar('discord_user_id', {
    length: 19
  }).notNull().unique('uni_user_discord_user_id').references(() => DiscordUser.discordUserId)
}, (table) => ({
  uniqueIndexOsuUserId: uniqueIndex('udx_user_osu_user_id').on(table.osuUserId)
}));

export const OsuUser = pgTable('osu_user', {
  osuUserId: integer('osu_user_id').primaryKey(),
  username: varchar('username', {
    length: 16
  }).notNull().unique('uni_osu_user_username'),
  restricted: boolean('restricted').notNull(),
  globalStdRank: integer('global_std_rank'),
  token: jsonb('token').notNull().$type<OAuthToken>(),
  countryCode: char('country_code', {
    length: 2
  })
    .notNull()
    .references(() => Country.code)
});

export const OsuBadge = pgTable('osu_badge', {
  id: serial('id').primaryKey(),
  /** Example: In URL `https://assets.ppy.sh/profile-badges/owc2023-winner.png`, `owc2023-winner.png` is the file name */
  imgFileName: varchar('img_file_name', {
    length: 60
  }).notNull(),
  description: text('description')
});

export const OsuUserAwardedBadge = pgTable('osu_user_awarded_badge', {
  osuUserId: integer('osu_user_id').notNull().references(() => OsuUser.osuUserId),
  osuBadgeId: integer('osu_badge_id').notNull().references(() => OsuBadge.id),
  awardedAt: timestamp('awarded_at', timestampConfig).notNull()
}, (table) => ({
  pk: primaryKey({
    columns: [table.osuUserId, table.osuBadgeId]
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
  token: jsonb('token').notNull().$type<OAuthToken>()
});

export const Session = pgTable('session', {
  id: bigserial('id', {
    mode: 'number'
  }).primaryKey(),
  createdAt: timestamp('created_at', timestampConfig).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', timestampConfig).notNull().defaultNow(),
  ipAddress: inet('ip_address').notNull(),
  ipMetadata: jsonb('ip_metadata').notNull().$type<{
    city: string;
    region: string;
    country: string;
  }>(),
  userAgent: text('user_agent').notNull(),
  expired: boolean('expired').notNull().default(false),
  userId: integer('user_id').notNull()
}, (table) => ({
  indexIdExpired: index('idx_session_id_expired').on(table.id, table.expired)
}));

export const Ban = pgTable('ban', {
  id: serial('id').primaryKey(),
  issuedAt: timestamp('issued_at', timestampConfig).notNull().defaultNow(),
  /** If null, then the ban is permanent */
  liftAt: timestamp('lift_at', timestampConfig),
  /** Date in which an admin has revoked the ban as a result of the user appealing */
  revokedAt: timestamp('revoked_at', timestampConfig),
  banReason: text('ban_reason').notNull(),
  issuedToUserId: integer('issued_to_user_id').notNull()
});

export const Notification = pgTable('notification', {
  id: bigserial('id', {
    mode: 'number'
  }).primaryKey(),
  messageHash: char('message_hash', {
    length: 32
  }).notNull().unique('uni_notification_message_hash'),
  /**
   * This message can contain variables that can then be replaced client side. Example:
   * ```plain
   * "You've been added as a staff member for {tournament:id} by {user:id}."
   * ```
   */
  message: text('message').notNull()
});

export const UserNotification = pgTable('user_notification', {
  userId: integer('user_id').notNull().references(() => User.id),
  notifiedAt: timestamp('notified_at', timestampConfig).notNull().defaultNow(),
  read: boolean('read').notNull().default(false),
  notificationId: bigint('notification_id', {
    mode: 'number'
  }).notNull().references(() => Notification.id)
}, (table) => ({
  pk: primaryKey({
    columns: [table.userId, table.notificationId]
  }),
  indexNotificationId: index('idx_user_notification_notification_id').on(table.notificationId),
  indexUserIdNotifiedAt: index('idx_user_notification_user_id_notified_at').on(table.userId, table.notifiedAt)
}));

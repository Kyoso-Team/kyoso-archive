import {
  bigint,
  bigserial,
  boolean,
  char,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';
import { timestampConfig } from './schema-utils';
import { sql } from 'drizzle-orm';
import type { OAuthToken, UserSettings } from '$types';

export const User = pgTable(
  'user',
  {
    id: serial('id').primaryKey(),
    registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
    updatedApiDataAt: timestamp('updated_api_data_at', timestampConfig).notNull().defaultNow(),
    admin: boolean('admin').notNull().default(false),
    approvedHost: boolean('approved_host').notNull().default(false),
    apiKey: varchar('api_key', {
      length: 24
    }),
    settings: jsonb('settings').notNull().$type<UserSettings>().default({
      publicDiscord: false,
      publicStaffHistory: true,
      publicPlayerHistory: true
    }),
    // Relations
    osuUserId: integer('osu_user_id')
      .notNull()
      .references(() => OsuUser.osuUserId),
    discordUserId: varchar('discord_user_id', {
      length: 19
    })
      .notNull()
      .references(() => DiscordUser.discordUserId)
  },
  (table) => ({
    uniqueIndexOsuUserId: uniqueIndex('udx_user_osu_user_id').on(table.osuUserId),
    uniqueIndexDiscordUserId: uniqueIndex('udx_user_discord_user_id').on(table.discordUserId),
    indexAdminApprovedHost: index('idx_user_admin_approved_host').on(
      table.admin,
      table.approvedHost
    ),
    uniqueIndexApiKey: uniqueIndex('udx_user_api_key').on(table.apiKey),
    indexUpdatedApiDataAt: index('idx_user_updated_api_data_at').on(table.updatedApiDataAt)
  })
);

export const OsuUser = pgTable(
  'osu_user',
  {
    osuUserId: integer('osu_user_id').primaryKey(),
    username: varchar('username', { length: 15 }).notNull().unique('uni_osu_user_username'),
    restricted: boolean('restricted').notNull(),
    globalStdRank: integer('global_std_rank'),
    globalTaikoRank: integer('global_taiko_rank'),
    globalCatchRank: integer('global_catch_rank'),
    globalManiaRank: integer('global_mania_rank'),
    token: jsonb('token').notNull().$type<OAuthToken>(),
    countryCode: char('country_code', {
      length: 2
    })
      .notNull()
      .references(() => Country.code)
  },
  (table) => ({
    indexUsername: index('idx_trgm_osu_user_username').using(
      'gist',
      sql`lower(${table.username}) gist_trgm_ops`
    )
  })
);

export const OsuBadge = pgTable(
  'osu_badge',
  {
    id: serial('id').primaryKey(),
    /** Example: In URL `https://assets.ppy.sh/profile-badges/owc2023-winner.png`, `owc2023-winner.png` is the file name */
    imgFileName: varchar('img_file_name', {
      length: 60
    }).notNull(),
    description: text('description')
  },
  (table) => ({
    indexImgFileName: uniqueIndex('udx_osu_badge_img_file_name').on(table.imgFileName)
  })
);

export const OsuUserAwardedBadge = pgTable(
  'osu_user_awarded_badge',
  {
    osuUserId: integer('osu_user_id')
      .notNull()
      .references(() => OsuUser.osuUserId),
    osuBadgeId: integer('osu_badge_id')
      .notNull()
      .references(() => OsuBadge.id),
    awardedAt: timestamp('awarded_at', timestampConfig).notNull()
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.osuUserId, table.osuBadgeId]
    }),
    indexOsuUserId: index('idx_osu_user_awarded_badge_osu_user_id').on(table.osuUserId)
  })
);

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
  username: varchar('username', { length: 32 }).notNull(),
  token: jsonb('token').notNull().$type<OAuthToken>()
});

export const Session = pgTable(
  'session',
  {
    id: bigserial('id', {
      mode: 'number'
    }).primaryKey(),
    createdAt: timestamp('created_at', timestampConfig).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', timestampConfig).notNull().defaultNow(),
    updateCookie: boolean('update_cookie').notNull().default(false),
    ipAddress: inet('ip_address').notNull(),
    ipMetadata: jsonb('ip_metadata').notNull().$type<{
      city: string;
      region: string;
      country: string;
    }>(),
    userAgent: text('user_agent').notNull(),
    expired: boolean('expired').notNull().default(false),
    userId: integer('user_id')
      .notNull()
      .references(() => User.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    indexIdExpired: index('idx_session_id_expired').on(table.id, table.expired),
    indexUserIdExpired: index('idx_session_user_id_expired').on(table.userId, table.expired)
  })
);

export const Ban = pgTable(
  'ban',
  {
    id: serial('id').primaryKey(),
    issuedAt: timestamp('issued_at', timestampConfig).notNull().defaultNow(),
    /** If null, then the ban is permanent */
    liftAt: timestamp('lift_at', timestampConfig),
    /** Date in which an admin has revoked the ban as a result of the user appealing */
    revokedAt: timestamp('revoked_at', timestampConfig),
    /** Reason why the user was unbanned (in case of any unfair bans) */
    revokeReason: text('revoke_reason'),
    banReason: text('ban_reason').notNull(),
    issuedByUserId: integer('issued_by_user_id')
      .notNull()
      .references(() => User.id),
    revokedByUserId: integer('revoked_by_user_id').references(() => User.id),
    issuedToUserId: integer('issued_to_user_id')
      .notNull()
      .references(() => User.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    indexIssuedToUserIdIssuedAt: index('idx_ban_issued_to_user_id_issued_at').on(
      table.issuedToUserId,
      table.issuedAt
    )
  })
);

export const Notification = pgTable('notification', {
  id: bigserial('id', {
    mode: 'number'
  }).primaryKey(),
  /**
   * This message can contain variables that can then be replaced client side. Example:
   * ```plain
   * "You've been added as a staff member for {tournament:id} by {user:id}."
   * ```
   */
  message: text('message').notNull()
});

export const UserNotification = pgTable(
  'user_notification',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => User.id, {
        onDelete: 'cascade'
      }),
    notificationId: bigint('notification_id', {
      mode: 'number'
    })
      .notNull()
      .references(() => Notification.id),
    notifiedAt: timestamp('notified_at', timestampConfig).notNull().defaultNow(),
    read: boolean('read').notNull().default(false)
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.notificationId]
    }),
    indexNotificationId: index('idx_user_notification_notification_id').on(table.notificationId),
    indexUserIdReadNotifiedAt: index('idx_user_notification_user_id_read_notified_at').on(
      table.userId,
      table.read,
      table.notifiedAt
    )
  })
);

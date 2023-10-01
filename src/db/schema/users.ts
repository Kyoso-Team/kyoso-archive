import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  smallint,
  text,
  char,
  numeric,
  unique
} from 'drizzle-orm/pg-core';
import {
  dbTournamentService,
  dbTournament,
  dbStaffMember,
  dbPlayer,
  dbIssue,
  dbTournamentDeletedNotif,
  dbGrantedTournamentHostNotif,
  dbStaffChangeNotif,
  dbTeamChangeNotif,
  dbPickemUser,
  dbStaffAppSubmission,
  dbUserToNotification
} from './';
import { timestampConfig, length, relation, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbUser = pgTable(
  'user',
  {
    id: serial('id').primaryKey(),
    registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
    updatedApiDataAt: timestamp('updated_api_data_at', timestampConfig).notNull().defaultNow(),
    lastNotificationAt: timestamp('last_notification_at', timestampConfig).notNull().defaultNow(),
    isAdmin: boolean('is_admin').notNull().default(false),
    osuUserId: integer('osu_user_id').notNull().unique('user_osu_user_id_key'),
    osuUsername: varchar('osu_username', length(16)).notNull().unique('user_osu_username_key'),
    isRestricted: boolean('is_restricted').notNull(),
    rank: integer('rank').notNull(),
    discordUserId: varchar('discord_user_id', length(19))
      .notNull()
      .unique('user_discord_user_id_key'),
    discordUsername: varchar('discord_username', length(32)).notNull(),
    discordDiscriminator: char('discord_discriminator', length(4)).notNull(),
    apiKey: varchar('api_key', length(24)).notNull().unique('user_api_key_key'),
    freeServicesLeft: smallint('free_services_left').notNull().default(3),
    showDiscordTag: boolean('show_discord_tag').notNull().default(true),
    // Auth
    osuAccessToken: text('osu_access_token').notNull(),
    osuRefreshToken: text('osu_refresh_token').notNull(),
    discordAccesstoken: text('discord_access_token').notNull(),
    discordRefreshToken: text('discord_refresh_token').notNull(),
    // Relations
    countryId: integer('country_id')
      .notNull()
      .references(() => dbCountry.id)
  },
  (tbl) => ({
    discordUsernameDiscordDiscriminatorKey: unique(
      'user_discord_username_discord_discriminator_key'
    ).on(tbl.discordUsername, tbl.discordDiscriminator)
  })
);

export const dbUserRelations = relations(dbUser, ({ one, many }) => ({
  country: one(dbCountry, {
    fields: [dbUser.countryId],
    references: [dbCountry.id]
  }),
  playerInfo: one(dbUserPlayerInfo),
  asStaffMember: many(dbStaffMember),
  asPlayer: many(dbPlayer),
  purchases: many(dbPurchase),
  notifications: many(dbUserToNotification),
  issuesSubmitted: many(dbIssue),
  inTournamentDeletedNotifs: many(dbTournamentDeletedNotif),
  inGrantedHostNotifsAsNewHost: many(dbGrantedTournamentHostNotif, relation('new_host')),
  inGrantedHostNotifsAsPrevHost: many(dbGrantedTournamentHostNotif, relation('prev_host')),
  inStaffChangeNotifs: many(dbStaffChangeNotif),
  inTeamChangeAsUser: many(dbTeamChangeNotif, relation('affected_user')),
  inTeamChangeAsKicker: many(dbTeamChangeNotif, relation('kicker')),
  asPickemUser: many(dbPickemUser),
  staffAppSubmissions: many(dbStaffAppSubmission)
}));

export const dbUserPlayerInfo = pgTable('user_player_info', {
  updatedAt: timestamp('updated_at', timestampConfig).notNull().defaultNow(),
  /**
   * A string that represents the availability between 0 - 23 UTC (24 digits), from Friday to Monday.
   * Where each digit can be either 0 (unavailable) or 1 (available).
   * Each day is separated by a period, similarly to an IP address
   */
  availability: char('availability', length(99)).notNull(),
  badgeCount: integer('badge_count').notNull(),
  userId: integer('user_id')
    .notNull()
    .primaryKey()
    .references(() => dbUser.id, actions('cascade'))
});

export const dbUserPlayerInfoRelations = relations(dbUserPlayerInfo, ({ one }) => ({
  user: one(dbUser, {
    fields: [dbUserPlayerInfo.userId],
    references: [dbUser.id]
  })
}));

export const dbCountry = pgTable('country', {
  id: serial('id').primaryKey(),
  name: varchar('name', length(35)).notNull(),
  code: char('code', length(2)).notNull().unique('country_code_key')
});

export const dbCountryRelations = relations(dbCountry, ({ many }) => ({
  users: many(dbUser)
}));

export const dbPurchase = pgTable('purchase', {
  id: serial('id').primaryKey(),
  purchasedAt: timestamp('purchased_at', timestampConfig).notNull().defaultNow(),
  cost: numeric('cost', {
    precision: 4,
    scale: 2
  }).notNull(),
  payPalOrderId: varchar('paypal_order_id', length(20)).notNull(),
  services: dbTournamentService('services')
    .array(dbTournamentService.enumValues.length)
    .notNull()
    .default([]),
  purchasedById: integer('purchased_by_id')
    .notNull()
    .references(() => dbUser.id, actions('cascade')),
  forTournamentId: integer('for_tournament_id').references(() => dbTournament.id)
});

export const dbPurchaseRelations = relations(dbPurchase, ({ one }) => ({
  purchasedBy: one(dbUser, {
    fields: [dbPurchase.purchasedById],
    references: [dbUser.id]
  }),
  forTournament: one(dbTournament, {
    fields: [dbPurchase.forTournamentId],
    references: [dbTournament.id]
  })
}));

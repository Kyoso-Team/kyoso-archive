import { pgTable, serial, varchar, timestamp, boolean, integer, smallint, text, char, numeric, unique } from 'drizzle-orm/pg-core';
import { dbTournamentService, dbUserTheme, dbTournament, dbStaffMember, dbPlayer, dbNotification, dbIssue, dbTournamentDeletedNotif, dbGrantedTournamentHostNotif, dbStaffChangeNotif, dbTeamChangeNotif, dbPickemUser, dbStaffAppSubmission } from './';
import { timestampConfig, length, relation, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbUser = pgTable('user', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', timestampConfig).notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  osuUserId: integer('osu_user_id').notNull().unique('user_osu_user_id_key'),
  osuUsername: varchar('osu_username', length(16)).notNull().unique('user_osu_username_key'),
  isRestricted: boolean('is_restricted'),
  discordUserId: varchar('discord_user_id', length(19)).notNull().unique('user_discord_user_id_key'),
  discordUsername: varchar('discord_username', length(32)).notNull(),
  discordDiscriminator: char('discord_discriminator', length(4)).notNull(),
  apiKey: varchar('api_key', length(24)).notNull().unique('user_api_key_key'),
  freeServicesLeft: smallint('free_services_left').notNull().default(3),
  // Auth
  osuAccessToken: text('osu_access_token').notNull(),
  osuRefreshToken: text('osu_refresh_token').notNull(),
  discordAccesstoken: text('discord_access_token').notNull(),
  discordRefreshToken: text('discord_refresh_token').notNull(),
  // Relations
  theme: dbUserTheme('theme').default('dark').notNull(),
  showDiscordTag: boolean('show_discord_tag').default(true),
  countryId: integer('country_id').notNull().references(() => dbCountry.id)
}, (tbl) => ({
  discordUsernameDiscordDiscriminatorKey: unique('user_discord_username_discord_discriminator_key').on(tbl.discordUsername, tbl.discordDiscriminator)
}));

export const dbUserRelations = relations(dbUser, ({ one, many }) => ({
  country: one(dbCountry, {
    fields: [dbUser.countryId],
    references: [dbCountry.id]
  }),
  asStaffMember: many(dbStaffMember),
  asPlayer: many(dbPlayer),
  purchases: many(dbPurchase),
  notifications: many(dbNotification),
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
  services: dbTournamentService('services').array(dbTournamentService.enumValues.length).notNull().default([]),
  purchasedById: integer('purchased_by_id').notNull().references(() => dbUser.id, actions('cascade')),
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

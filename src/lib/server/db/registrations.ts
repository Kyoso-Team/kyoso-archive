import {
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  timestamp,
  unique
} from 'drizzle-orm/pg-core';
import { StaffColor, StaffPermission, Tournament, User } from './schema';
import { citext, timestampConfig, uniqueConstraints } from './schema-utils';

export const StaffRole = pgTable(
  'staff_role',
  {
    id: serial('id').primaryKey(),
    name: citext('name').notNull(),
    color: StaffColor('color').notNull().default('slate'),
    order: smallint('order').notNull(),
    permissions: StaffPermission('permissions').array().notNull().default([]),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    uniqueNameTournamentId: unique(uniqueConstraints.staffRoles.nameTournamentId).on(
      table.name,
      table.tournamentId
    )
  })
);

export const StaffMember = pgTable(
  'staff_member',
  {
    id: serial('id').primaryKey(),
    joinedStaffAt: timestamp('joined_staff_at', timestampConfig).notNull().defaultNow(),
    userId: integer('user_id')
      .notNull()
      .references(() => User.id, {
        onDelete: 'cascade'
      }),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    uniqueUserIdTournamentId: unique('uni_staff_member_user_id_tournament_id').on(
      table.userId,
      table.tournamentId
    )
  })
);

export const StaffMemberRole = pgTable(
  'staff_member_role',
  {
    staffMemberId: integer('staff_member_id')
      .notNull()
      .references(() => StaffMember.id, {
        onDelete: 'cascade'
      }),
    staffRoleId: integer('staff_role_id')
      .notNull()
      .references(() => StaffRole.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.staffMemberId, table.staffRoleId]
    })
  })
);

// export const dbStaffApplication = pgTable('staff_application', {
//   title: varchar('title', length(90)).notNull(),
//   description: text('description'),
//   forTournamentId: integer('tournament_id')
//     .primaryKey()
//     .references(() => dbTournament.id, actions('cascade'))
// });

// export const dbStaffAppRole = pgTable(
//   'staff_application_role',
//   {
//     id: serial('id').primaryKey(),
//     name: varchar('name', length(45)).notNull(),
//     description: text('description'),
//     staffApplicationId: integer('staff_application_id')
//       .notNull()
//       .references(() => dbStaffApplication.forTournamentId, actions('cascade'))
//   },
//   (tbl) => ({
//     nameStaffApplicationIdKey: uniqueIndex(
//       'staff_application_role_name_staff_application_id_key'
//     ).on(tbl.name, tbl.staffApplicationId)
//   })
// );

// export const dbStaffAppSubmission = pgTable('staff_application_submission', {
//   id: serial('id').primaryKey(),
//   submittedAt: timestamp('submitted_at', timestampConfig).notNull().defaultNow(),
//   applyingFor: varchar('applying_for', length(45)).array().notNull().default([]),
//   status: dbJoinRequestStatus('status').notNull().default('pending'),
//   staffingExperience: text('staffing_experience').notNull(),
//   additionalComments: text('additional_comments'),
//   staffApplicationId: integer('staff_application_id')
//     .notNull()
//     .references(() => dbStaffApplication.forTournamentId, actions('cascade')),
//   submittedById: integer('submitted_by_id')
//     .notNull()
//     .references(() => User.id, actions('cascade'))
// });

// export const dbTeam = pgTable(
//   'team',
//   {
//     id: serial('id').primaryKey(),
//     registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
//     name: varchar('name', length(20)).notNull(),
//     inviteId: char('invite_id', length(8)).notNull().unique('team_invite_id_key'),
//     hasBanner: boolean('has_banner').notNull().default(false),
//     avgRank: real('average_rank').notNull(),
//     avgBwsRank: real('average_bws_rank').notNull(),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     captainId: integer('captain_id')
//       .notNull()
//       .references(() => dbPlayer.id)
//       .unique('team_captain_id_key')
//   },
//   (tbl) => ({
//     nameTournamentIdKey: unique('team_name_tournament_id_key').on(tbl.name, tbl.tournamentId)
//   })
// );

// export const dbJoinTeamRequest = pgTable('join_team_request', {
//   id: serial('id').primaryKey(),
//   requestedAt: timestamp('requested_at', timestampConfig).notNull().defaultNow(),
//   status: dbJoinRequestStatus('status').notNull().default('pending'),
//   sentById: integer('sent_by_id')
//     .notNull()
//     .references(() => dbPlayer.id),
//   teamId: integer('team_id')
//     .notNull()
//     .references(() => dbTeam.id)
// });

// // If the player is in a team tournament and doesn't have a team, then they're a free agent
// export const dbPlayer = pgTable(
//   'player',
//   {
//     id: serial('id').primaryKey(),
//     registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
//     bwsRank: integer('bws_rank'),
//     tournamentId: integer('tournament_id')
//       .notNull()
//       .references(() => dbTournament.id, actions('cascade')),
//     userId: integer('user_id')
//       .notNull()
//       .references(() => User.id, actions('cascade')),
//     teamId: integer('team_id').references((): AnyPgColumn => dbTeam.id)
//   },
//   (tbl) => ({
//     userIdTournamentIdKey: unique('player_user_id_tournament_id_key').on(
//       tbl.userId,
//       tbl.tournamentId
//     )
//   })
// );

import {
  pgTable,
  serial,
  integer,
  unique,
  smallint,
  timestamp,
  primaryKey,
  boolean,
  index,
  jsonb,
  uniqueIndex,
  bigserial,
  bigint
} from 'drizzle-orm/pg-core';
import { InviteReason, InviteStatus, StaffColor, StaffPermission, Tournament, User } from './schema';
import { timestampConfig, citext } from './schema-utils';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const StaffRole = pgTable(
  'staff_role',
  {
    id: serial('id').primaryKey(),
    /** Limit of 50 characters */
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
    uniqueNameTournamentId: unique('uni_staff_role_name_tournament_id').on(
      table.name,
      table.tournamentId
    ),
    tournamentIdOrder: index('idx_staff_role_tournament_id_order').on(table.tournamentId, table.order)
  })
);

export const StaffMember = pgTable(
  'staff_member',
  {
    id: serial('id').primaryKey(),
    joinedStaffAt: timestamp('joined_staff_at', timestampConfig).notNull().defaultNow(),
    deleted: boolean('deleted').notNull().default(false),
    userId: integer('user_id')
      .references(() => User.id, {
        onDelete: 'set null'
      }),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    uniqueUserIdTournamentId: uniqueIndex('udx_staff_member_user_id_tournament_id').on(
      table.userId,
      table.tournamentId
    ),
    indexDeleted: index('idx_staff_member_deleted').on(table.deleted)
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

export const Team = pgTable('team', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  deleted: boolean('deleted').notNull().default(false),
  /** Limit of 20 characters */
  name: citext('name').notNull(),
  bannerMetadata: jsonb('banner_metadata').$type<{
    fileId: string;
    originalFileName: string;
  }>(),
  tournamentId: integer('tournament_id').notNull().references(() => Tournament.id, {
    onDelete: 'cascade'
  }),
  captainPlayerId: integer('captain_player_id').notNull().references(() => Player.id)
}, (table) => ({
  uniqueNameTournamentId: unique('uni_team_name_tournament_id').on(table.name, table.tournamentId),
  uniqueCaptainPlayerIdTournamentId: uniqueIndex('udx_team_captain_player_id_tournament_id').on(
    table.captainPlayerId,
    table.tournamentId
  ),
  indexName: index('idx_team_name').on(table.name),
  indexDeleted: index('idx_team_deleted').on(table.deleted)
}));

export const Player = pgTable('player', {
  id: serial('id').primaryKey(),
  registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
  joinedTeamAt: timestamp('joined_team_at', timestampConfig),
  deleted: boolean('deleted').notNull().default(false),
  /** No gamemode is specified unlike the User table because (in the case we support more gamemodes in the future) an STD tournament won't be interested in the user's Taiko BWS rank and the same applied for other gamemodes */
  bwsRank: integer('bws_rank'),
  /**
   * The player's availability to play matches across the weekend.
   * Each element in the array represents a day of the week in the following order: Friday, Saturday, Sunday and Monday
   * The value of each element is an integer that represents the user's availability that can be decoded into an array of 24 elements representing the 24 hours of the day and each value being either 0 (not available) or 1 (available)
   */
  availability: integer('availability').array(4).notNull().default([0, 0, 0, 0]),
  userId: integer('user_id')
    .references(() => User.id, {
      onDelete: 'set null'
    }),
  tournamentId: integer('tournament_id')
    .notNull()
    .references(() => Tournament.id, {
      onDelete: 'cascade'
    }),
  teamId: integer('team_id').references((): AnyPgColumn => Team.id)
}, (table) => ({
  uniqueTournamentIdTeamIdUserId: uniqueIndex('udx_player_tournament_id_team_id_user_id').on(
    table.tournamentId,
    table.teamId,
    table.userId
  ),
  indexDeleted: index('idx_player_deleted').on(table.deleted)
}));

export const Invite = pgTable('invite', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sentAt: timestamp('sent_at', timestampConfig).notNull().defaultNow(),
  status: InviteStatus('status').notNull().default('pending'),
  reason: InviteReason('reason').notNull(),
  byUserId: integer('by_user_id')
    .references(() => User.id, {
      onDelete: 'set null'
    }),
  toUserId: integer('to_user_id')
    .references(() => User.id, {
      onDelete: 'set null'
    }),
  /** Must be not null if reason is "join_team" */
  teamId: integer('team_id').references(() => Team.id),
  /** Must be not null if reason is "join_staff" or "delegate_host" */
  tournamentId: integer('tournament_id')
    .references(() => Tournament.id, {
      onDelete: 'cascade'
    })
});

export const InviteWithRole = pgTable('invite_with_role', {
  inviteId: bigint('invite_id', { mode: 'number' })
    .notNull()
    .references(() => Invite.id, {
      onDelete: 'cascade'
    }),
  staffRoleId: integer('staff_role_id')
    .notNull()
    .references(() => StaffRole.id, {
      onDelete: 'cascade'
    })
}, (table) => ({
  pk: primaryKey({
    columns: [table.inviteId, table.staffRoleId]
  })
}));

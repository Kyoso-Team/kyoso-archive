import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  timestamp,
  unique,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';
import { InviteReason, InviteStatus, StaffColor, StaffPermission, Tournament, User } from '.';
import { timestampConfig, uniqueConstraints } from './constants';
import { sql } from 'drizzle-orm';

/* In a tournament, order 1-5 are reserved as follows:
  1- Debugger
  2- Host
  3-5 are available in case any new defaults are added
*/
export const StaffRole = pgTable(
  'staff_role',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
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
    ),
    tournamentIdOrder: index('idx_staff_role_tournament_id_order').on(
      table.tournamentId,
      table.order
    )
  })
);

export const StaffMember = pgTable(
  'staff_member',
  {
    id: serial('id').primaryKey(),
    joinedStaffAt: timestamp('joined_staff_at', timestampConfig).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', timestampConfig),
    userId: integer('user_id').references(() => User.id, {
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
    indexJoinedStaffAt: index('idx_staff_member_joined_staff_at').on(table.joinedStaffAt.desc()),
    indexDeletedAt: index('idx_staff_member_deleted_at').on(table.deletedAt)
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

export const Team = pgTable(
  'team',
  {
    id: serial('id').primaryKey(),
    registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', timestampConfig),
    name: varchar('name', { length: 20 }).notNull(),
    bannerMetadata: jsonb('banner_metadata').$type<{
      fileId: string;
      originalFileName: string;
    }>(),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      }),
    captainPlayerId: integer('captain_player_id')
      .notNull()
      .references(() => Player.id)
  },
  (table) => ({
    uniqueNameTournamentId: unique('uni_team_name_tournament_id').on(
      table.name,
      table.tournamentId
    ),
    uniqueCaptainPlayerIdTournamentId: uniqueIndex('udx_team_captain_player_id_tournament_id').on(
      table.captainPlayerId,
      table.tournamentId
    ),
    indexName: index('idx_trgm_team_name').using('gist', sql`lower(${table.name}) gist_trgm_ops`),
    indexDeletedRegisteredAt: index('idx_team_deleted_at_registered_at').on(
      table.deletedAt,
      table.registeredAt
    )
  })
);

export const Player = pgTable(
  'player',
  {
    id: serial('id').primaryKey(),
    registeredAt: timestamp('registered_at', timestampConfig).notNull().defaultNow(),
    joinedTeamAt: timestamp('joined_team_at', timestampConfig),
    deletedAt: timestamp('deleted_at', timestampConfig),
    /** No gamemode is specified unlike the User table because (in the case we support more gamemodes in the future) an STD tournament won't be interested in the user's Taiko BWS rank and the same applied for other gamemodes */
    bwsRank: integer('bws_rank'),
    /**
     * The player's availability to play matches across the weekend.
     * Each element in the array represents a day of the week in the following order: Friday, Saturday, Sunday and Monday
     * The value of each element is an integer that represents the user's availability that can be decoded into an array of 24 elements representing the 24 hours of the day and each value being either 0 (not available) or 1 (available)
     */
    availability: integer('availability').array(4).notNull().default([0, 0, 0, 0]),
    userId: integer('user_id').references(() => User.id, {
      onDelete: 'set null'
    }),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      }),
    teamId: integer('team_id').references((): AnyPgColumn => Team.id)
  },
  (table) => ({
    uniqueTournamentIdTeamIdUserId: uniqueIndex('udx_player_tournament_id_team_id_user_id').on(
      table.tournamentId,
      table.teamId,
      table.userId
    ),
    indexDeletedRegisteredAt: index('idx_player_registered_at_joined_team_at_deleted_at').on(
      table.registeredAt,
      table.joinedTeamAt,
      table.deletedAt
    )
  })
);

export const Invite = pgTable(
  'invite',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    sentAt: timestamp('sent_at', timestampConfig).notNull().defaultNow(),
    status: InviteStatus('status').notNull().default('pending'),
    reason: InviteReason('reason').notNull(),
    byUserId: integer('by_user_id').references(() => User.id, {
      onDelete: 'set null'
    }),
    toUserId: integer('to_user_id').references(() => User.id, {
      onDelete: 'set null'
    }),
    /** Must be not null if reason is "join_team" */
    teamId: integer('team_id').references(() => Team.id),
    /** Must be not null if reason is "join_staff" or "delegate_host" */
    tournamentId: integer('tournament_id').references(() => Tournament.id, {
      onDelete: 'cascade'
    })
  },
  (table) => ({
    indexStatusReasonToUserIdSentAt: index('idx_invite_status_reason_to_user_id_sent_at').on(
      table.status,
      table.reason,
      table.toUserId,
      table.sentAt
    ),
    indexTeamId: index('idx_invite_team_id').on(table.teamId),
    indexTournamentId: index('idx_invite_tournament_id').on(table.tournamentId)
  })
);

/** Only used when Invite.reason is "join_staff" */
export const InviteWithRole = pgTable(
  'invite_with_role',
  {
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
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.inviteId, table.staffRoleId]
    })
  })
);

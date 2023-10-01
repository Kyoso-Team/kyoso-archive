import { pgTable, bigserial, varchar, timestamp, integer, bigint } from 'drizzle-orm/pg-core';
import {
  dbUser,
  dbIssueNotifType,
  dbStaffChangeNotifAction,
  dbStaffAppSubmission,
  dbJoinTeamRequest,
  dbTeam,
  dbTeamChangeNotifAction,
  dbRoundPublicationNotifType,
  dbRound,
  dbIssue,
  dbTournament,
  dbUserToNotification
} from '.';
import { timestampConfig, length, actions } from '../utils';
import { relations } from 'drizzle-orm';

export const dbNotification = pgTable('notification', {
  id: bigserial('id', {
    mode: 'number'
  }).primaryKey(),
  notifiedAt: timestamp('notified_at', timestampConfig).notNull().defaultNow()
});

export const dbNotificationRelations = relations(dbNotification, ({ one, many }) => ({
  notifiedTo: many(dbUserToNotification),
  grantedTournamentHost: one(dbGrantedTournamentHostNotif),
  joinTeamRequest: one(dbJoinTeamRequestNotif),
  issue: one(dbIssueNotif),
  newStaffAppSubmission: one(dbNewStaffAppSubmissionNotif),
  roundPublication: one(dbRoundPublicationNotif),
  staffChange: one(dbStaffChangeNotif),
  teamChange: one(dbTeamChangeNotif),
  tournamentDeleted: one(dbTournamentDeletedNotif)
}));

// Notifies admins when a new issue is submitted or notifies the user who submitted the issue that the issue has been resolved
export const dbIssueNotif = pgTable('issue_notification', {
  notifType: dbIssueNotifType('notification_type').notNull(),
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  issueId: integer('issue_id').references(() => dbIssue.id)
});

export const dbIssueNotifRelations = relations(dbIssueNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbIssueNotif.notificationId],
    references: [dbNotification.id]
  }),
  issue: one(dbIssue, {
    fields: [dbIssueNotif.issueId],
    references: [dbIssue.id]
  })
}));

// Notifies players and staff members that a tournament they were in has been deleted
export const dbTournamentDeletedNotif = pgTable('tournament_deleted_notification', {
  tournamentName: varchar('tournament_name', length(50)).notNull(),
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  hostedById: integer('hosted_by_id').references(() => dbUser.id)
});

export const dbTournamentDeletedNotifRelations = relations(dbTournamentDeletedNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbTournamentDeletedNotif.notificationId],
    references: [dbNotification.id]
  }),
  hostedBy: one(dbUser, {
    fields: [dbTournamentDeletedNotif.hostedById],
    references: [dbUser.id]
  })
}));

// Notifies the granted user when a user is granted the host role in a tournament
export const dbGrantedTournamentHostNotif = pgTable('granted_tournament_host_notification', {
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  tournamentId: integer('tournament_id').references(() => dbTournament.id),
  previousHostId: integer('previous_host_id').references(() => dbUser.id),
  newHostId: integer('new_host_id').references(() => dbUser.id)
});

export const dbGrantedTournamentHostNotifRelations = relations(
  dbGrantedTournamentHostNotif,
  ({ one }) => ({
    notification: one(dbNotification, {
      fields: [dbGrantedTournamentHostNotif.notificationId],
      references: [dbNotification.id]
    }),
    tournament: one(dbTournament, {
      fields: [dbGrantedTournamentHostNotif.tournamentId],
      references: [dbTournament.id]
    }),
    previousHost: one(dbUser, {
      fields: [dbGrantedTournamentHostNotif.previousHostId],
      references: [dbUser.id],
      relationName: 'prev_host'
    }),
    newHost: one(dbUser, {
      fields: [dbGrantedTournamentHostNotif.newHostId],
      references: [dbUser.id],
      relationName: 'new_host'
    })
  })
);

// Notifies a user when they're added to or removed from a tournament's staff team
export const dbStaffChangeNotif = pgTable('staff_change_notification', {
  action: dbStaffChangeNotifAction('action').notNull(),
  addedWithRoles: varchar('added_with_roles', length(25)).array().notNull().default([]),
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  userId: integer('user_id').references(() => dbUser.id)
});

export const dbStaffChangeNotifRelations = relations(dbStaffChangeNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbStaffChangeNotif.notificationId],
    references: [dbNotification.id]
  }),
  user: one(dbUser, {
    fields: [dbStaffChangeNotif.userId],
    references: [dbUser.id]
  })
}));

// Notifies tournament staff members with the "MutateStaffMembers" permission when a tournament receives a new application from a user to join the staff team
export const dbNewStaffAppSubmissionNotif = pgTable(
  'new_staff_application_submission_notification',
  {
    notificationId: bigint('notification_id', {
      mode: 'number'
    })
      .primaryKey()
      .references(() => dbNotification.id, actions('cascade')),
    staffAppSubmissionId: integer('staff_application_submission_id').references(
      () => dbStaffAppSubmission.id
    )
  }
);

export const dbNewStaffAppSubmissionNotifRelations = relations(
  dbNewStaffAppSubmissionNotif,
  ({ one }) => ({
    notification: one(dbNotification, {
      fields: [dbNewStaffAppSubmissionNotif.notificationId],
      references: [dbNotification.id]
    }),
    staffAppSubmission: one(dbStaffAppSubmission, {
      fields: [dbNewStaffAppSubmissionNotif.staffAppSubmissionId],
      references: [dbStaffAppSubmission.id]
    })
  })
);

// Notifies a team captain when a player has requested to be a part of their team
export const dbJoinTeamRequestNotif = pgTable('join_team_request_notification', {
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  requestId: integer('request_id').references(() => dbJoinTeamRequest.id)
});

export const dbJoinTeamRequestNotifRelations = relations(dbJoinTeamRequestNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbJoinTeamRequestNotif.notificationId],
    references: [dbNotification.id]
  }),
  request: one(dbJoinTeamRequest, {
    fields: [dbJoinTeamRequestNotif.requestId],
    references: [dbJoinTeamRequest.id]
  })
}));

// Notifies a team's players and the joined/kicked player when a new player joins, leaves or gets kicked from the team
export const dbTeamChangeNotif = pgTable('team_change_notification', {
  action: dbTeamChangeNotifAction('action').notNull(),
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  teamId: integer('team_id').references(() => dbTeam.id),
  affectedUserId: integer('affected_user_id').references(() => dbUser.id),
  kickedById: integer('kicked_by_id').references(() => dbUser.id)
});

export const dbTeamChangeNotifRelations = relations(dbTeamChangeNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbTeamChangeNotif.notificationId],
    references: [dbNotification.id]
  }),
  team: one(dbTeam, {
    fields: [dbTeamChangeNotif.teamId],
    references: [dbTeam.id]
  }),
  affectedUser: one(dbUser, {
    fields: [dbTeamChangeNotif.affectedUserId],
    references: [dbUser.id],
    relationName: 'affected_user'
  }),
  kickedBy: one(dbUser, {
    fields: [dbTeamChangeNotif.kickedById],
    references: [dbUser.id],
    relationName: 'kicker'
  })
}));

// Notifies a tournament's players and staff members with the "MutateTournament" and "Host" permissions that the mappool, match schedules or statistics for a round has been made public
export const dbRoundPublicationNotif = pgTable('round_publication_notification', {
  publicized: dbRoundPublicationNotifType('publicized').notNull(),
  notificationId: bigint('notification_id', {
    mode: 'number'
  })
    .primaryKey()
    .references(() => dbNotification.id, actions('cascade')),
  roundId: integer('round_id').references(() => dbRound.id)
});

export const dbRoundPublicationNotifRelations = relations(dbRoundPublicationNotif, ({ one }) => ({
  notification: one(dbNotification, {
    fields: [dbRoundPublicationNotif.notificationId],
    references: [dbNotification.id]
  }),
  round: one(dbRound, {
    fields: [dbRoundPublicationNotif.roundId],
    references: [dbRound.id]
  })
}));

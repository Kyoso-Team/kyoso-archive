import {
  Notification,
  Player,
  ScheduledNotification,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  UserNotification,
  db
} from '$db';
import { and, count, desc, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { future, past, pick } from '$lib/server/utils';
import type { AnyPgTable, PgTransaction, PgSelectBase } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { AnyPgNumberColumn, PaginationSettings, Simplify } from '$types';

export async function getCount(table: AnyPgTable, where?: SQL) {
  return await db
    .select({ count: count().as('count') })
    .from(table)
    .where(where)
    .then(([{ count }]) => count);
}

export async function setSimilarityThreshold() {
  return await db.execute(sql`set pg_trgm.similarity_threshold = 0.1`);
}

/**
 * @param message The message that can be written in markdown and can have "variables"
 * @param notifyTo A subquery that will be used in a CTE to select the users to notify
 * @param tx Provide a transaction client (optional)
 *
 * Example:
 * ```ts
 * await createNotification(
 *   'Player registrations for {tournament:1} are closing in 3 days',
 *  `tournament:${1}:player_regs_close_at_reminder_1`
 *   // Notify all players in tournament of ID 1
 *   (db, pickUserId) => db.select(pickUserId(Player.userId)).from(Player).where(eq(Player.tournamentId, 1))
 * );
 * ```
 */
export async function createNotification(options: {
  tx: PgTransaction<any, any, any>;
  message: string;
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
  /** @internal Only used in `rescheduleNotification` function */
  scheduled?: boolean;
}) {
  const { message, notifyTo, tx, scheduled } = options;

  const notification = await tx
    .insert(Notification)
    .values({ message, notifiedAt: scheduled ? null : undefined })
    .returning(pick(Notification, ['id']))
    .then((rows) => rows[0]);

  const sq = notifyTo(tx, (userId) => ({ userId }));
  const userId = db.$with('user_to_notify').as(sq).userId;
  await tx.execute(
    sql`
      with "user_to_notify" as (${sq})
      insert into ${UserNotification} (${UserNotification.notificationId}, ${UserNotification.userId})
      select ${notification.id}, ${userId}
      from "user_to_notify"
    `
  );

  return notification;
}

export async function rescheduleNotification(options: {
  tx: PgTransaction<any, any, any>;
  message: string;
  event: string;
  scheduledAt: Date;
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
  scheduleIf: boolean;
}) {
  const { message, notifyTo, tx, scheduledAt, event } = options;

  const notification = await tx
    .select(pick(ScheduledNotification, ['notificationId']))
    .from(ScheduledNotification)
    .where(eq(ScheduledNotification.event, event))
    .limit(1)
    .then((rows) => rows?.[0]);

  // Create a scheduled notification
  if (options.scheduleIf && !notification) {
    const createdNotification = await createNotification({
      tx,
      message,
      notifyTo,
      scheduled: true
    });
    await tx
      .insert(ScheduledNotification)
      .values({ scheduledAt, event, notificationId: createdNotification.id });
  }

  // Reschedule notification
  if (options.scheduleIf && notification) {
    await tx
      .update(ScheduledNotification)
      .set({ scheduledAt })
      .where(eq(ScheduledNotification.notificationId, notification.notificationId));
  }

  // Cancel notification
  if (!options.scheduleIf && notification) {
    await tx.delete(Notification).where(eq(Notification.id, notification.notificationId));
  }
}

export async function noLongerNotifyScheduledNotificationToUser(options: {
  tx: PgTransaction<any, any, any>;
  event: string;
  dontNotifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
}) {
  const { tx, event, dontNotifyTo } = options;

  const dontNotifyUser = tx
    .$with('dont_notify_user')
    .as(dontNotifyTo(tx, (userId) => ({ userId })));
  const notificationSq = tx
    .$with('notification')
    .as(
      tx
        .select({ id: ScheduledNotification })
        .from(ScheduledNotification)
        .where(eq(ScheduledNotification.event, event))
        .limit(1)
    );

  await tx
    .with(notificationSq, dontNotifyUser)
    .delete(UserNotification)
    .where(
      and(
        eq(UserNotification.notificationId, db.select().from(notificationSq)),
        inArray(UserNotification.userId, db.select().from(dontNotifyUser))
      )
    );
}

const baseUserHistorySelect = {
  ...pick(Tournament, [
    'urlSlug',
    'name',
    'acronym',
    'bannerMetadata',
    'logoMetadata',
    'rankRange',
    'type',
    'teamSettings'
  ]),
  ongoing: sql<boolean>`(${or(
    isNull(TournamentDates.concludesAt),
    future(TournamentDates.concludesAt)
  )})`.as('ongoing')
};

export async function getUserStaffHistory(userId: number, { offset, limit }: PaginationSettings) {
  return await db
    .selectDistinctOn([Tournament.id, TournamentDates.publishedAt], {
      ...baseUserHistorySelect,
      staffRoles: sql<Simplify<Pick<typeof StaffRole.$inferSelect, 'name' | 'color' | 'order'>>[]>`
        coalesce(
          json_agg(
            json_build_object(
              'name',
              ${StaffRole.name},
              'color',
              ${StaffRole.color},
              'order',
              ${StaffRole.order}
            )
          ),
          '[]'::json
        )
      `.as('staff_roles')
    })
    .from(Tournament)
    .innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
    .innerJoin(StaffMember, eq(StaffMember.tournamentId, Tournament.id))
    .innerJoin(StaffMemberRole, eq(StaffMemberRole.staffMemberId, StaffMember.id))
    .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
    .where(
      and(
        isNotNull(TournamentDates.publishedAt),
        past(TournamentDates.publishedAt),
        or(isNull(Tournament.deletedAt), future(Tournament.deletedAt)),
        or(isNull(StaffMember.deletedAt), future(StaffMember.deletedAt)),
        eq(StaffMember.userId, userId)
      )
    )
    .groupBy(Tournament.id, TournamentDates.concludesAt, TournamentDates.publishedAt)
    .orderBy(desc(TournamentDates.publishedAt))
    .offset(offset)
    .limit(limit);
}

export async function getUserPlayerHistory(userId: number, { offset, limit }: PaginationSettings) {
  return await db
    .select({
      ...baseUserHistorySelect,
      team: pick(Team, ['id', 'name'])
    })
    .from(Tournament)
    .innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
    .innerJoin(Player, eq(Player.tournamentId, Tournament.id))
    .leftJoin(Team, eq(Team.id, Player.teamId))
    .where(
      and(
        isNotNull(TournamentDates.publishedAt),
        past(TournamentDates.publishedAt),
        or(isNull(Tournament.deletedAt), future(Tournament.deletedAt)),
        or(isNull(Player.deletedAt), future(Player.deletedAt)),
        eq(Player.userId, userId)
      )
    )
    .orderBy(desc(TournamentDates.publishedAt))
    .offset(offset)
    .limit(limit);
}

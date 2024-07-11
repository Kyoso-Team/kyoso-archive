import {
  Notification,
  OsuUser,
  ScheduledNotification,
  Tournament,
  User,
  UserNotification,
  db
} from '$db';
import { and, count, eq, getTableName, inArray, isNull, or, sql } from 'drizzle-orm';
import { past, pick } from '$lib/server/utils';
import type {
  AnyPgTable,
  PgTransaction,
  PgSelectBase,
  AnyPgColumn,
  AnyPgSelect
} from 'drizzle-orm/pg-core';
import type postgres from 'postgres';
import type { SQL } from 'drizzle-orm';
import type { AnyPgNumberColumn } from '$types';
import type { notificationLinkTypes } from '$lib/constants';

/**
 * Creates a notification that gets send immediately to a specific set of users
 * @param tx Transaction client
 * @param message See Notification table definition
 * @param important See Notification table definition
 * @param notifyTo A subquery that will be used in a CTE to select the users to notify
 * @param linkTo See Notification table definition (optional)
 * @param scheduled Only used in `rescheduleNotification` function, should not be used outside of that function
 */
export async function createNotification(options: {
  tx: PgTransaction<any, any, any>;
  message: string;
  important: boolean;
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
  linkTo?: string;
  scheduled?: boolean;
}) {
  const { message, notifyTo, tx, scheduled, important, linkTo } = options;

  const sq = notifyTo(tx, (userId) => ({ userId }));
  const userCount = await tx
    .select({ count: count().as('count') })
    .from(sq as any)
    .then(([{ count }]) => count);

  if (userCount === 0) return;

  const notification = await tx
    .insert(Notification)
    .values({
      message,
      important,
      linkTo,
      global: false,
      notifiedAt: scheduled ? null : undefined
    })
    .returning(pick(Notification, ['id']))
    .then((rows) => rows[0]);

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

/**
 * Creates a notification that gets send immediately to all users
 * @param tx Transaction client
 * @param message See Notification table definition
 * @param important See Notification table definition
 * @param linkTo See Notification table definition (optional)
 */
export async function createGlobalNotification(options: {
  tx: PgTransaction<any, any, any>;
  message: string;
  important: boolean;
  linkTo?: string;
}) {
  const { message, tx, important, linkTo } = options;

  const notification = await tx
    .insert(Notification)
    .values({
      message,
      important,
      linkTo,
      global: true
    })
    .returning(pick(Notification, ['id']))
    .then((rows) => rows[0]);

  await tx.execute(
    sql`
      insert into ${UserNotification} (${UserNotification.notificationId}, ${UserNotification.userId})
      select ${notification.id}, ${User.id}
      from ${User}
    `
  );

  return notification;
}

/**
 * Creates a scheduled notification or reschedules the notification
 * @param tx Transaction client
 * @param message See Notification table definition
 * @param important See Notification table definition
 * @param event See ScheduledNotification table definition
 * @param scheduledAt When the notification gets sent
 * @param notifyTo A subquery that will be used in a CTE to select the users to notify
 * @param scheduleIf If true, the notification will be scheduled (if it doesn't exist) or rescheduled (if it exists); if false, the notification won't be created or will be cancelled (deleted)
 * @param linkTo See Notification table definition (optional)
 */
export async function rescheduleNotification(options: {
  tx: PgTransaction<any, any, any>;
  message: string;
  important: boolean;
  event: string;
  scheduledAt: Date;
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
  scheduleIf: boolean;
  linkTo?: string;
}) {
  const { message, notifyTo, tx, scheduledAt, event, important, scheduleIf, linkTo } = options;

  const notification = await tx
    .select(pick(ScheduledNotification, ['notificationId']))
    .from(ScheduledNotification)
    .where(eq(ScheduledNotification.event, event))
    .limit(1)
    .then((rows) => rows?.[0]);

  // Create a scheduled notification
  if (scheduleIf && !notification) {
    const createdNotification = await createNotification({
      tx,
      message,
      important,
      notifyTo,
      linkTo,
      scheduled: true
    });

    if (createdNotification) {
      await tx
        .insert(ScheduledNotification)
        .values({ scheduledAt, event, notificationId: createdNotification.id });
    }
  }

  // Reschedule notification
  if (scheduleIf && notification) {
    await tx
      .update(ScheduledNotification)
      .set({ scheduledAt })
      .where(eq(ScheduledNotification.notificationId, notification.notificationId));
  }

  // Cancel notification
  if (!scheduleIf && notification) {
    await tx.delete(Notification).where(eq(Notification.id, notification.notificationId));
  }
}

/**
 * Cancels a scheduled notification for a specific set of users
 * @param tx Transaction client
 * @param event The same event that was used to create the scheduled notification using the `rescheduleNotification` function
 * @param dontNotifyTo A subquery that will be used in a CTE to select the users to no longer notify
 */
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

  const notification = await tx
    .select({
      id: ScheduledNotification.notificationId,
      usersToNotifyCount: count(UserNotification.userId).as('users_to_notify_count')
    })
    .from(ScheduledNotification)
    .innerJoin(
      UserNotification,
      eq(UserNotification.notificationId, ScheduledNotification.notificationId)
    )
    .where(eq(ScheduledNotification.event, event))
    .groupBy(ScheduledNotification.notificationId)
    .limit(1)
    .then((rows) => rows?.[0]);

  if (!notification) return;

  const deletedCount = await tx
    .execute(
      tx
        .with(dontNotifyUser)
        .delete(UserNotification)
        .where(
          and(
            eq(UserNotification.notificationId, notification.id),
            inArray(UserNotification.userId, db.select().from(dontNotifyUser))
          )
        )
    )
    .then(({ count }: postgres.RowList<Record<string, unknown>[]>) => count);

  if (notification.usersToNotifyCount - deletedCount === 0) {
    await tx.delete(Notification).where(eq(Notification.id, notification.id));
  }
}

function msgVarSubquery(options: {
  table: AnyPgTable;
  id: AnyPgColumn;
  label: AnyPgColumn | SQL;
  urlParam: AnyPgColumn | SQL;
  where: SQL | undefined;
  joins?: (db: Pick<AnyPgSelect, 'fullJoin' | 'leftJoin' | 'innerJoin' | 'rightJoin'>) => any;
}) {
  let a: AnyPgSelect = db
    .select({
      label: options.label,
      id: sql`(${options.id})::text`,
      table: sql`${getTableName(options.table)}`,
      urlParams: sql`(${options.urlParam})::text`
    })
    .from(options.table)
    .$dynamic();

  if (options.joins) {
    a = options.joins(a);
  }

  return sql`(${a.where(options.where)})`;
}

const notificationLinkMap: Record<(typeof notificationLinkTypes)[number], string> = {
  dashboard: '/dashboard',
  user: '/user/{user}',
  manage_tournament: '/m/{tournament}',
  tournament: '/t/{tournament}',
  manage_round_mappool: '/',
  manage_round_schedule: '/',
  manage_round_stats: '/',
  round_mappool: '/',
  round_schedule: '/',
  round_stats: '/',
  manage_form: '/',
  manage_staff_roles: '/',
  manage_staff_members: '/',
  manage_registrations: '/',
  manage_registration: '/'
};

/**
 * Maps the variables in a notification message and link with the corresponding strings
 * Example:
 * ```plain
 * "You've been added as a staff member for {tournament:id} by {user:id}."
 * => "You've been added as a staff member for osu! World Cup 2024 by ppy."
 * ```
 */
export async function mapNotificationVars<
  T1 extends Pick<typeof Notification.$inferSelect, 'message' | 'linkTo'>,
  T2 extends T1 | T1[]
>(notifications: T2): Promise<T2> {
  let notifications1 = (Array.isArray(notifications) ? notifications : [notifications]) as T1[];
  const messageVars = [
    ...new Set(notifications1.map(({ message }) => message.match(/(\w+):(\w+)/g) || []).flat())
  ];

  const vars = [getTableName(Tournament), getTableName(User)] as const;
  const ids = Object.fromEntries(vars.map((v) => [v, [] as string[]]));
  const subqueries: SQL[] = [];

  for (let i = 0; i < messageVars.length; i++) {
    const split = messageVars[i].split(':');
    const thing = split[0];
    const id = split[1];
    ids[thing]?.push(id);
  }

  if (ids.tournaments.length > 0) {
    subqueries.push(
      msgVarSubquery({
        table: Tournament,
        id: Tournament.id,
        label: Tournament.name,
        urlParam: Tournament.urlSlug,
        where: and(
          or(isNull(Tournament.deletedAt), past(Tournament.deletedAt)),
          inArray(Tournament.id, ids.tournaments.map(Number))
        )
      })
    );
  }

  if (ids.users.length > 0) {
    subqueries.push(
      msgVarSubquery({
        table: User,
        id: User.id,
        label: OsuUser.username,
        urlParam: User.id,
        joins: (db) => db.innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId)),
        where: inArray(User.id, ids.users.map(Number))
      })
    );
  }

  const values = Object.fromEntries(vars.map((v) => [v, {}])) as Record<
    (typeof vars)[number],
    Partial<
      Record<
        string,
        {
          label: string;
          urlParam: string;
        }
      >
    >
  >;
  if (subqueries.length > 0) {
    const results = await db.execute(sql.join(subqueries, sql` union all `));

    for (const result of results) {
      const { id, label, table, urlParam } = result as {
        id: string;
        label: string;
        table: (typeof vars)[number];
        urlParam: string;
      };
      values[table][id] = { label, urlParam };
    }
  }

  const deleted = Object.fromEntries(
    vars.map((v) => {
      const label = v
        .split('_')
        .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join(' ');
      return [v, `[Deleted ${label}]`];
    })
  ) as Record<(typeof vars)[number], string>;

  notifications1 = notifications1.map((notification) => {
    const { message } = notification;
    let { linkTo } = notification;
    const messageVars = message.match(/{(\w+):(\w+)}/g) || [];

    for (let i = 0; i < messageVars.length; i++) {
      const split = messageVars[i].slice(1, -1).split(':');
      const thing = split[0] as (typeof vars)[number];
      const id = split[1];
      const value = values[thing][id];
      const str = `<span data-color="primary">${value ? value.label : deleted[thing]}</span>`;
      message.replace(messageVars[i], str);
    }

    if (linkTo && (notificationLinkMap as Record<string, string>)[linkTo]) {
      const pathname = notificationLinkMap[linkTo as keyof typeof notificationLinkMap];
      const pathnameVars = pathname.match(/{(\w+)}/g) || [];

      for (let i = 0; i < pathnameVars.length; i++) {
        const thing = pathnameVars[i].slice(1, -1) as (typeof vars)[number];
        const id = messageVars
          .find((varName) => varName.includes(thing))
          ?.slice(1, -1)
          .split(':')[1];
        const value = id ? values[thing][id]?.urlParam : undefined;

        if (!value) {
          linkTo = null;
          break;
        }

        linkTo.replace(pathnameVars[i], value);
      }
    }

    return {
      ...notification,
      message,
      linkTo
    };
  });

  return (Array.isArray(notifications) ? notifications1 : notifications1[0]) as any;
}

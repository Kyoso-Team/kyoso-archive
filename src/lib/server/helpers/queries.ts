import {
  Notification,
  OsuUser,
  Player,
  ScheduledNotification,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  User,
  UserNotification,
  db
} from '$db';
import {
  and,
  count,
  desc,
  eq,
  getTableName,
  inArray,
  isNotNull,
  isNull,
  or,
  sql
} from 'drizzle-orm';
import { future, past, pick } from '$lib/server/utils';
import type {
  AnyPgTable,
  PgTransaction,
  PgSelectBase,
  AnyPgColumn,
  AnyPgSelect
} from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { AnyPgNumberColumn, PaginationSettings, Simplify } from '$types';
import type { notificationLinkTypes } from '$lib/constants';

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
  important: boolean;
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>;
  linkTo?: string;
  /** @internal Only used in `rescheduleNotification` function */
  scheduled?: boolean;
}) {
  const { message, notifyTo, tx, scheduled, important, linkTo } = options;

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
}) {
  const { message, notifyTo, tx, scheduledAt, event, important, scheduleIf } = options;

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
      scheduled: true
    });
    await tx
      .insert(ScheduledNotification)
      .values({ scheduledAt, event, notificationId: createdNotification.id });
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

export async function getNotificationMessageVariableValues<
  T extends Pick<typeof Notification.$inferSelect, 'message' | 'linkTo'>
>(notifications: T | T[]): Promise<T[]> {
  const notifications1 = Array.isArray(notifications) ? notifications : [notifications];
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

  return notifications1.map((notification) => {
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
        const id = messageVars.find((varName) => varName.includes(thing))?.slice(1, -1).split(':')[1];
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

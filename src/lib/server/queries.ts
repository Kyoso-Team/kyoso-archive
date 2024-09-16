import { db } from '$lib/server/services';
import {
  Notification,
  Player,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  UserNotification
} from '$db';
import { and, count, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import { past, future } from './sql';
import type { AnyPgTable, PgTransaction, PgSelectBase } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { AnyPgNumberColumn, PaginationSettings, Simplify } from '$types';

export async function recordExists(table: AnyPgTable, where?: SQL) {
  return await db.execute(sql`select 1 as "exists" from ${table} where ${where} limit 1`).then((rows) => !!rows.at(0)?.exists);
}

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
 *
 * @param message The message that can be written in markdown and can have "variables"
 * @param notifyTo A subquery that will be used in a CTE to select the users to notify
 * @param tx Provide a transaction client (optional)
 *
 * Example:
 * ```ts
 * await createNotification(
 *   'Player registrations for {tournament:1} are closing in 24 hours',
 *   // Notify all players in tournament of ID 1
 *   (db, pickUserId) => db.select(pickUserId(Player.userId)).from(Player).where(eq(Player.tournamentId, 1))
 * );
 * ```
 */
export async function createNotification(
  message: string,
  notifyTo: (
    db: PgTransaction<any, any, any>,
    pickUserId: <T extends AnyPgNumberColumn>(columnAsUserId: T) => { userId: T }
  ) => PgSelectBase<any, any, any>,
  tx?: PgTransaction<any, any, any>
) {
  async function cb(tx: PgTransaction<any, any, any>) {
    const notification = await tx
      .insert(Notification)
      .values({ message })
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
  }

  if (tx) {
    await cb(tx);
  } else {
    await db.transaction(cb);
  }
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

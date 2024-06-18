import {
  Notification,
  Player,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  UserNotification,
  db
} from '$db';
import { and, count, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { future, past, pick } from '$lib/server/utils';
import type { AnyPgTable, PgTransaction } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { PaginationSettings, Simplify } from '$types';

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

export async function createNotification(
  message: string,
  notifyUserIds: number[],
  tx?: PgTransaction<any, any, any>
) {
  async function cb(tx: PgTransaction<any, any, any>) {
    const notification = await tx
      .insert(Notification)
      .values({ message })
      .returning(pick(Notification, ['id']))
      .then((rows) => rows[0]);

    await tx
      .insert(UserNotification)
      .values(notifyUserIds.map((userId) => ({ userId, notificationId: notification.id })));
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
      staffRoles: sql`
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
      `
        .mapWith(
          (value) =>
            JSON.parse(value) as Simplify<
              Pick<typeof StaffRole.$inferSelect, 'name' | 'color' | 'order'>
            >[]
        )
        .as('staff_roles')
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

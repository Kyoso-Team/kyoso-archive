import { Notification, UserNotification, db } from '$db';
import { count, sql } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import type { AnyPgTable, PgSelectBase, PgTransaction } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { AnyPgNumberColumn } from '$types';

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

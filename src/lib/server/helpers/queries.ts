import { Notification, UserNotification, db } from '$db';
import { count, sql } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import type { AnyPgTable, PgTransaction } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

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

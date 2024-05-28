import { db } from '$db';
import { count, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

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

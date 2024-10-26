import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export function future(column: AnyPgColumn | SQL) {
  return sql`${column} > now()`;
}

export function past(column: AnyPgColumn | SQL) {
  return sql`${column} <= now()`;
}

export function isNullOrFuture(column: AnyPgColumn | SQL) {
  return sql`(${column} is null or ${column} > now())`;
}

export function trgmSearch(searchStr: string, columns: [AnyPgColumn, ...AnyPgColumn[]]) {
  const q = sql`${searchStr} % (lower(${columns[0]})`;

  for (const col in columns.slice(1)) {
    q.append(sql` || ' ' || lower(${col})`);
  }

  q.append(sql`)`);
  return q;
}

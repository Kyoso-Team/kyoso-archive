import type { PgTimestampConfig, UpdateDeleteAction } from 'drizzle-orm/pg-core';

export const timestampConfig: PgTimestampConfig = {
  mode: 'date',
  withTimezone: true,
  precision: 3
};

/** @deprecated */
export function length(length: number) {
  return { length };
}

/** @deprecated */
export function relation(relationName: string) {
  return { relationName };
}

/** @deprecated */
export function actions(onDelete: UpdateDeleteAction, onUpdate?: UpdateDeleteAction) {
  return {
    onDelete,
    onUpdate
  };
}

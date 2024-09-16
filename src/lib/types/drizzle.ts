import type { PgColumn } from 'drizzle-orm/pg-core';

export type AnyPgNumberColumn = PgColumn<
  {
    name: any;
    tableName: any;
    dataType: 'number';
    columnType: any;
    data: any;
    driverParam: any;
    notNull: any;
    hasDefault: any;
    enumValues: any;
    baseColumn: any;
  },
  any,
  any
>;

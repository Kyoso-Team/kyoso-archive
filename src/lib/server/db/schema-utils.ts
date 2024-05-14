import { customType, type PgTimestampConfig } from 'drizzle-orm/pg-core';

export const timestampConfig: PgTimestampConfig = {
  mode: 'date',
  withTimezone: true,
  precision: 3
};

export const uniqueConstraints = {
  tournament: {
    name: 'uni_tournament_name',
    urlSlug: 'udx_tournament_url_slug'
  },
  staffRoles: {
    uniqueNameTournamentId: 'uni_staff_role_name_tournament_id'
  }
} as const;

export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  }
});

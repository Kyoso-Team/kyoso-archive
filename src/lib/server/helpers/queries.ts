import {
  Player,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  db
} from '$db';
import { and, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { future, past, pick } from '$lib/server/utils';
import type { PaginationSettings, Simplify } from '$types';

export async function setSimilarityThreshold() {
  return await db.execute(sql`set pg_trgm.similarity_threshold = 0.1`);
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

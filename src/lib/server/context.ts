import { and, eq } from 'drizzle-orm';
import { StaffMember, StaffMemberRole, StaffRole, Tournament, TournamentDates } from '$db';
import { env } from '$lib/server/env';
import { catcher, error } from '$lib/server/error';
import { db, redis } from '$lib/server/services';
import { pick, verifyJWT } from '$lib/server/utils';
import type { Cookies } from '@sveltejs/kit';
import type { StaffPermission } from '$db';
import type { AuthSession, ErrorInside, InferEnum, Simplify } from '$lib/types';

export function getSession<T extends boolean>(
  inside: ErrorInside,
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  const user = verifyJWT<AuthSession>(cookies.get('session'));

  if (mustBeSignedIn && !user) {
    error(inside, 'unauthorized', 'You must be logged in');
  }

  return user as AuthSession;
}

export async function getStaffMember<T extends boolean>(
  inside: ErrorInside,
  session: AuthSession,
  tournamentId: number,
  mustBeStaffMember?: T
): Promise<
  T extends true
    ? {
        id: number;
        permissions: InferEnum<typeof StaffPermission>[];
      }
    : undefined
> {
  const staffMember = await db
    .select({
      id: StaffMember.id,
      permissions: StaffRole.permissions
    })
    .from(StaffMemberRole)
    .innerJoin(StaffMember, eq(StaffMember.id, StaffMemberRole.staffMemberId))
    .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
    .where(and(eq(StaffMember.userId, session.userId), eq(StaffRole.tournamentId, tournamentId)))
    .then((rows) => ({
      id: rows[0].id,
      permissions: Array.from(new Set(rows.map(({ permissions }) => permissions).flat()))
    }))
    .catch(catcher(inside, 'Getting the current user as a staff member'));

  if (!staffMember && mustBeStaffMember) {
    error(inside, 'unauthorized', 'Not a staff member');
  }

  if (env.NODE_ENV !== 'production' && staffMember) {
    const permissions = await redis.get<InferEnum<typeof StaffPermission>[]>(
      `staff_permissions:${staffMember.id}`
    );
    staffMember.permissions = permissions !== null ? permissions : staffMember.permissions;
  }

  return staffMember as any;
}

export async function getTournament<
  MustExist extends boolean,
  TournamentFields extends (keyof typeof Tournament.$inferSelect)[] = [],
  DatesFields extends (keyof Omit<typeof TournamentDates.$inferSelect, 'tournamentId'>)[] = []
>(
  inside: ErrorInside,
  tournamentId: number | string,
  fields: {
    tournament?: TournamentFields;
    dates?: DatesFields;
  },
  tournamentMustExist?: MustExist
): Promise<
  MustExist extends true
    ? Simplify<
        Pick<typeof Tournament.$inferSelect, TournamentFields[number]> &
          Pick<typeof TournamentDates.$inferSelect, DatesFields[number]>
      >
    : undefined
> {
  let q!: any; // Don't know how to make this type safe

  const qBase = db.select({
    ...(fields.tournament ? pick(Tournament, fields.tournament) : {}),
    ...(fields.dates ? pick(TournamentDates, fields.dates) : {})
  });

  if (fields.tournament) {
    q = qBase.from(Tournament);

    if (fields.dates) {
      q = q.innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id));
    }
  } else {
    q = qBase.from(TournamentDates);
  }

  const tournament = await q
    .where(
      typeof tournamentId === 'number'
        ? eq(Tournament.id, tournamentId)
        : eq(Tournament.urlSlug, tournamentId)
    )
    .limit(1)
    .then((rows: any[]) => rows[0])
    .catch(catcher(inside, 'Getting the tournament'));

  if (!tournament && tournamentMustExist) {
    error(inside, 'not_found', 'Tournament not found');
  }

  return tournament as any;
}

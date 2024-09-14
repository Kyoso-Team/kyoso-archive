import env from '$lib/env.server';
import { StaffMember, StaffMemberRole, StaffRole, Tournament, TournamentDates, db } from '$db';
import { and, eq } from 'drizzle-orm';
import { pick, verifyJWT } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { redis } from '$lib/server/redis';
import type { Cookies } from '@sveltejs/kit';
import type { AuthSession, InferEnum, OnServerError, Simplify } from '$types';
import type { StaffPermission } from '$db';

export async function baseGetStaffMember<T extends boolean>(
  session: AuthSession | undefined,
  tournamentId: number,
  trpc: boolean,
  errors: {
    onGetStaffMemberError: OnServerError;
  },
  mustBeStaffMember?: T
): Promise<
  T extends true
    ? {
        id: number;
        permissions: InferEnum<typeof StaffPermission>[];
      }
    : undefined
> {
  let staffMember:
    | {
        id: number;
        permissions: InferEnum<typeof StaffPermission>[];
      }
    | undefined;

  if (session) {
    try {
      staffMember = await db
        .select({
          id: StaffMember.id,
          permissions: StaffRole.permissions
        })
        .from(StaffMemberRole)
        .innerJoin(StaffMember, eq(StaffMember.id, StaffMemberRole.staffMemberId))
        .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
        .where(
          and(eq(StaffMember.userId, session.userId), eq(StaffRole.tournamentId, tournamentId))
        )
        .then((rows) => ({
          id: rows[0].id,
          permissions: Array.from(new Set(rows.map(({ permissions }) => permissions).flat()))
        }));
    } catch (err) {
      await errors.onGetStaffMemberError(err);
    }
  }

  if (!staffMember && mustBeStaffMember) {
    const errMessage = 'You must be a staff member for this tournament';

    if (trpc) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: errMessage
      });
    } else {
      error(401, errMessage);
    }
  }

  if (env.NODE_ENV === 'development' && staffMember) {
    const permissions = await redis.get<InferEnum<typeof StaffPermission>[]>(
      `staff_permissions:${staffMember.id}`
    );
    staffMember.permissions = permissions !== null ? permissions : staffMember.permissions;
  }

  return staffMember as any;
}

export async function baseGetTournament<
  MustExist extends boolean,
  TournamentFields extends (keyof typeof Tournament.$inferSelect)[] = [],
  DatesFields extends (keyof Omit<typeof TournamentDates.$inferSelect, 'tournamentId'>)[] = []
>(
  tournamentId: number | string,
  fields: {
    tournament?: TournamentFields;
    dates?: DatesFields;
  },
  trpc: boolean,
  errors: {
    onGetTournamentError: OnServerError;
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
  let tournament: Record<string, any> | undefined;
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

  try {
    tournament = await q
      .where(
        typeof tournamentId === 'number'
          ? eq(Tournament.id, tournamentId)
          : eq(Tournament.urlSlug, tournamentId)
      )
      .limit(1)
      .then((rows: any[]) => rows[0]);
  } catch (err) {
    await errors.onGetTournamentError(err);
  }

  if (!tournament && tournamentMustExist) {
    const errMessage = 'Tournament not found';

    if (trpc) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: errMessage
      });
    } else {
      error(404, errMessage);
    }
  }

  return tournament as any;
}

export function baseGetSession<T extends boolean>(
  cookies: Cookies,
  trpc: boolean,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  const user = verifyJWT<AuthSession>(cookies.get('session'));

  if (mustBeSignedIn && !user) {
    const errMessage = 'You must be logged in';

    if (trpc) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: errMessage
      });
    } else {
      error(401, errMessage);
    }
  }

  return user as AuthSession;
}

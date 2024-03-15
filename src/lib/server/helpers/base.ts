import { StaffMember, StaffMemberRole, StaffRole, db } from '$db';
import { and, eq } from 'drizzle-orm';
import { verifyJWT } from '$lib/server/utils';
import { error, type Cookies } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import type { AuthSession, InferEnum, OnServerError } from '$types';
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
      permissions: InferEnum<typeof StaffPermission>[]
    }
    : undefined
> {
  let staffMember: {
    id: number;
    permissions: InferEnum<typeof StaffPermission>[]
  } | undefined;

  if (session) {
    try {
      staffMember = await db
        .select({
          id: StaffMember.id,
          permissions: StaffRole.permissions
        }).from(StaffMemberRole)
        .innerJoin(StaffMember, eq(StaffMember.id, StaffMemberRole.staffMemberId))
        .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
        .where(and(
          eq(StaffMember.userId, session.userId),
          eq(StaffRole.tournamentId, tournamentId)
        ))
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

  return staffMember as any;
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

import { StaffMember, StaffMemberRole, StaffRole, db } from '$db';
import { and, eq } from 'drizzle-orm';
import { verifyJWT } from '$lib/server/utils';
import { error, type Cookies } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import type { AuthSession, InferEnum, OnServerError } from '$types';
import type { StaffPermission } from '$db';

export async function baseGetStaffMember<T extends AuthSession | undefined>(session: T, tournamentId: number, errors: {
  onGetStaffMemberError: OnServerError;
}): Promise<T extends AuthSession ? {
  id: number;
  permissions: InferEnum<typeof StaffPermission>[]
} : undefined> {
  if (!session) {
    return undefined as any;
  };

  let staffMember!: {
    id: number;
    permissions: InferEnum<typeof StaffPermission>[]
  };

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

  return staffMember as any;
}

export function baseGetSession<T extends boolean>(
  cookies: Cookies | Record<string, string | undefined>,
  trpc: boolean,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  const sessionCookie = 'get' in cookies
    ? (cookies as Cookies).get('session')
    : (cookies as Record<string, string | undefined>).session;
  const user = verifyJWT<AuthSession>(sessionCookie);

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

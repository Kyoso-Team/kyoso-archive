import { z, ZodAny, ZodObject, type ZodAnyDef, type ZodRawShape } from 'zod';
import { verifyJWT } from '$lib/jwt';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { TRPCError, type DeepPartial } from '@trpc/server';
import { removeDuplicates } from './utils';
import type { StaffPermission } from '@prisma/client';
import type { SessionUser } from '$types';

export function getStoredUser<T extends boolean>(
  event: RequestEvent,
  mustBeSignedIn: T
): T extends true ? SessionUser : SessionUser | undefined {
  let user = verifyJWT<SessionUser>(event.cookies.get('session'));

  if (mustBeSignedIn && !user) {
    throw redirect(302, '/unauthorized?reason=singedOut');
  }

  return user as SessionUser;
}

export function mustHavePerms(staffMember: {
  roles: {
    permissions: StaffPermission[];
  }[];
}, necessaryPermissions: StaffPermission[] | StaffPermission) {
  let userPermissions: StaffPermission[] = [];
  
  staffMember.roles.forEach((role) => {
    userPermissions.push(... role.permissions);
  });

  userPermissions = removeDuplicates(userPermissions);

  return (Array.isArray(necessaryPermissions))
    ? userPermissions.some((userPerm) => necessaryPermissions.includes(userPerm))
    : userPermissions.some((userPerm) => necessaryPermissions === userPerm);
}

export function isAllowed(isAllowed: boolean, action: string) {
  if (!isAllowed) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `You're not allowed to ${action}`
    });
  }
}
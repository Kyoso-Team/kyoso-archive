import { z, type AnyZodObject } from 'zod';
import { verifyJWT } from '$lib/jwt';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { removeDuplicates } from './utils';
import type { StaffPermission } from '@prisma/client';
import type { SessionUser } from '$types';
import type { URL } from 'url';

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

export function mustHavePerms(
  staffMember: {
    roles: {
      permissions: StaffPermission[];
    }[];
  },
  necessaryPermissions: StaffPermission[] | StaffPermission
) {
  let userPermissions: StaffPermission[] = [];

  staffMember.roles.forEach((role) => {
    userPermissions.push(...role.permissions);
  });

  userPermissions = removeDuplicates(userPermissions);

  return Array.isArray(necessaryPermissions)
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

function mapUrlParams(params: URLSearchParams, prefix: string, allStrings?: boolean) {
  let obj: Record<string, unknown> = {};

  if (!allStrings) {
    params.forEach((value, key) => {
      if (!key.startsWith(prefix)) return;

      if (!isNaN(Number(value)) && value !== '') {
        obj[key] = Number(value);
      } else if (value === 'true') {
        obj[key] = true;
      } else if (value === 'false') {
        obj[key] = false;
      } else if (value !== '') {
        obj[key] = value;
      }
    });
  }

  return obj;
}

export function getUrlParams<A extends AnyZodObject, B extends AnyZodObject>(
  url: URL,
  filtersSchema: A,
  sortSchema: B
): {
  page: number;
  search?: string;
  filters: z.infer<A>;
  sort: z.infer<B>;
} {
  let params = url.searchParams;
  let page = params.get('page') || '';
  let search = params.get('search') || '';

  return z
    .object({
      page: z.number().default(1),
      search: z.string().optional(),
      filters: filtersSchema.partial(),
      sort: sortSchema.partial()
    })
    .parse({
      page: page === '' ? 1 : Number(page) < 0 ? 1 : parseInt(page),
      search: search === '' ? undefined : search,
      filters: mapUrlParams(params, 'f.'),
      sort: mapUrlParams(params, 's.', true)
    });
}

export function paginate(page: number, elementsPerPage: number = 30) {
  return {
    skip: elementsPerPage * (page - 1),
    take: elementsPerPage
  };
}

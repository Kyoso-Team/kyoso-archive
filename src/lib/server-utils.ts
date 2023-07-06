import { z } from 'zod';
import { verifyJWT } from '$lib/jwt';
import { redirect, type Cookies } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { hasTournamentConcluded } from './utils';
import type { AnyZodObject } from 'zod';
import type { URL } from 'url';
import type { SessionUser } from '$types';
import type { MappoolState, TournamentService } from '@prisma/client';

export const forbidIf = {
  hasConcluded: (tournament: {
    id: number;
    concludesOn: Date | null;
  }) => {
    if (hasTournamentConcluded(tournament)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Tournament of ID ${tournament.id} has concluded.`
      });
    }
  },
  doesntIncludeService: (tournament: {
    id: number;
    services: TournamentService[];
  }, mustInclude: TournamentService) => {
    if (!tournament.services.includes(mustInclude)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Tournament of ID ${tournament.id} doesn't have the ${mustInclude.toLowerCase()} service.`
      });
    }
  },
  poolIsPublished: (round: {
    id: number;
    mappoolState: MappoolState;
  }) => {
    if (round.mappoolState === 'Public') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Round of ID ${round.id} already has its mappool published.`
      });
    }
  }
}

export function getStoredUser<T extends boolean>(
  event: { cookies: Cookies },
  mustBeSignedIn: T
): T extends true ? SessionUser : SessionUser | undefined {
  let user = verifyJWT<SessionUser>(event.cookies.get('session'));

  if (mustBeSignedIn && !user) {
    throw redirect(302, '/unauthorized?reason=singedOut');
  }

  return user as SessionUser;
}

export function isAllowed(isAllowed: boolean, action: string) {
  if (!isAllowed) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `You're not allowed to ${action}.`
    });
  }
}

function mapUrlParams(params: URLSearchParams, prefix: string, allStrings?: boolean) {
  let obj: Record<string, unknown> = {};

  params.forEach((value, key) => {
    if (!key.startsWith(prefix)) return;
    let k = key.startsWith(prefix) ? key.replace(prefix, '') : key;

    if (allStrings) {
      obj[k] = value;
      return;
    }

    if (!isNaN(Number(value)) && value !== '') {
      obj[k] = Number(value);
    } else if (value === 'true') {
      obj[k] = true;
    } else if (value === 'false') {
      obj[k] = false;
    } else if (value !== '') {
      obj[k] = value;
    }
  });

  return obj;
}

export function getUrlParams<A extends AnyZodObject, B extends AnyZodObject>(
  url: URL,
  filtersSchema: A,
  sortSchema: B
): {
  page: number;
  search?: string;
  filters: Partial<z.infer<A>>;
  sort: Partial<z.infer<B>>;
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
      search: search === '' ? '' : decodeURIComponent(search),
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

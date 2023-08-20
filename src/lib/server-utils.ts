import db from '$db';
import { z } from 'zod';
import { verifyJWT } from '$lib/jwt';
import { redirect, type Cookies } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { hasTournamentConcluded } from './utils';
import { asc, desc, sql } from 'drizzle-orm';
import type { AnyZodObject } from 'zod';
import type { URL } from 'url';
import type { SessionUser, Sort, MappoolState, TournamentService } from '$types';
import type { AnyColumn, SQL, SQLWrapper } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

export const forbidIf = {
  hasConcluded: (tournament: { id: number; concludesOn: Date | null }) => {
    if (hasTournamentConcluded(tournament)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Tournament of ID ${tournament.id} has concluded.`
      });
    }
  },
  doesntIncludeService: (
    tournament: {
      id: number;
      services: TournamentService[];
    },
    mustInclude: TournamentService
  ) => {
    if (!tournament.services.includes(mustInclude)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Tournament of ID ${
          tournament.id
        } doesn't have the ${mustInclude.toLowerCase()} service.`
      });
    }
  },
  poolIsPublished: (round: { id: number; mappoolState: MappoolState }) => {
    if (round.mappoolState === 'public') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Round of ID ${round.id} already has its mappool published.`
      });
    }
  }
};

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
  search: string;
  filters: Partial<z.infer<A>>;
  sort: Partial<z.infer<B>>;
} {
  let params = url.searchParams;
  let page = params.get('page') || '';
  let search = params.get('search') || '';

  return z
    .object({
      page: z.number().default(1),
      search: z.string(),
      filters: filtersSchema.partial(),
      sort: sortSchema.partial()
    })
    .parse({
      page: page === '' ? 1 : Number(page) < 0 ? 1 : parseInt(page),
      search: search === '' ? '' : decodeURIComponent(search).toLowerCase(),
      filters: mapUrlParams(params, 'f.'),
      sort: mapUrlParams(params, 's.', true)
    });
}

export function paginate(page: number, elementsPerPage: number = 30) {
  return {
    offset: elementsPerPage * (page - 1),
    limit: elementsPerPage
  };
}

export function findFirst<T>(queryResults: T[]): T | undefined {
	return queryResults.at(0);
}

export function findFirstOrThrow<T>(queryResults: T[], objectName: string): T {
	let result = queryResults.at(0);

	if (!result) {
		throw new Error(`Couldn't find ${objectName}`);
	}

	return result;
}

export function orderBy<T extends AnyColumn | SQLWrapper>(column: T, sort: Sort) {
  return sort === 'asc' ? asc(column) : desc(column);
}

export function textSearch(...columns: AnyColumn[]) {
  let q = sql``;

  for (let i = 0; i < columns.length - 1; i++) {
    let sq = sql`lower(${columns[i]}) || ' ' || `;
    q.append(sq);
  }

  let sq = sql`lower(${columns.at(-1)}) ilike `;
  q.append(sq);

  return {
    query: (str: string) => {
      let sq = sql`'${str}'`;
      q.append(sq);
      return q; 
    }
  };
}

export async function getRowCount<T extends AnyPgTable>(
  table: T,
  where?: SQL | undefined
) {
  let q = db.select({
    count: sql`count(*)::bigint`.mapWith(Number)
  }).from(table);
  
  if (where) {
    q.where(where);
  }

  return (await q)[0].count;
}

export function select<
  T extends AnyPgTable,
  F extends Exclude<keyof T, 'getSQL' | '_'>,
  I extends F
>(table: T, fields: I[]) {
  let map = new Map<string, AnyPgColumn>([]);
 
  for (let i = 0; i < fields.length; i++) {
    let column = table[fields[i]] as AnyPgColumn;
    map.set(fields[i].toString(), column);
  }

  return Object.fromEntries(map) as Omit<T, Exclude<F, I> | 'getSQL' | '_'>;
}

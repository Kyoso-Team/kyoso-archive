import env from '$lib/server/env';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';
import { error } from '@sveltejs/kit';
import { isOsuJSError } from 'osu-web.js';
import { TRPCError } from '@trpc/server';
import { customAlphabet } from 'nanoid';
import { SQL, gt, lte, sql } from 'drizzle-orm';
import { ValiError } from 'valibot';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

export function signJWT<T>(data: T) {
  return jwt.sign(data as string | object | Buffer, env.JWT_SECRET, {
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });
}

export function verifyJWT<T>(token?: string) {
  if (!token) {
    return undefined;
  }

  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256']
    }) as T;
  } catch {
    return undefined;
  }
}

export function generateFileId() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return customAlphabet(alphabet, 8)();
}

// function mapUrlParams(params: URLSearchParams, prefix: string, allStrings?: boolean) {
//   let obj: Record<string, unknown> = {};

//   params.forEach((value, key) => {
//     if (!key.startsWith(prefix)) return;
//     let k = key.startsWith(prefix) ? key.replace(prefix, '') : key;

//     if (allStrings) {
//       obj[k] = value;
//       return;
//     }

//     if (!isNaN(Number(value)) && value !== '') {
//       obj[k] = Number(value);
//     } else if (value === 'true') {
//       obj[k] = true;
//     } else if (value === 'false') {
//       obj[k] = false;
//     } else if (value !== '') {
//       obj[k] = value;
//     }
//   });

//   return obj;
// }

/**
 * Parses the URL's search parameters for searching and filtering purposes based on the provided Zod schemas
 */
// export function getUrlParams<A extends AnyZodObject, B extends AnyZodObject>(
//   url: URL,
//   filtersSchema: A,
//   sortSchema: B
// ): {
//   page: number;
//   search: string;
//   filters: Partial<z.infer<A>>;
//   sort: Partial<z.infer<B>>;
// } {
//   let params = url.searchParams;
//   let page = params.get('page') || '';
//   let search = params.get('search') || '';

//   return z
//     .object({
//       page: z.number().default(1),
//       search: z.string(),
//       filters: filtersSchema.partial(),
//       sort: sortSchema.partial()
//     })
//     .parse({
//       page: page === '' ? 1 : Number(page) < 0 ? 1 : parseInt(page),
//       search: search === '' ? '' : decodeURIComponent(search).toLowerCase(),
//       filters: mapUrlParams(params, 'f.'),
//       sort: mapUrlParams(params, 's.', true)
//     });
// }

/**
 * Paginate data in database queries
 */
export function paginate(page: number, elementsPerPage: number = 30) {
  return {
    offset: elementsPerPage * (page - 1),
    limit: elementsPerPage
  };
}

/**
 * Maps the table's columns in a select clause to avoid writing verbose objects.
 * Example:
 *
 * ```ts
 * // Without pick
 * db.select({
 *  id: Tournament.id,
 *  name: Tournament.name,
 *  acronym: Tournament.acronym
 * })
 * // With pick
 * db.select(pick(Tournament, [
 *  'id',
 *  'name',
 *  'acronym'
 * ]))
 * ```
 */
export function pick<
  T extends AnyPgTable,
  F extends Exclude<keyof T, 'getSQL' | '_' | '$inferSelect' | '$inferInsert'>
>(table: T, fields: F[]) {
  const map = new Map<string, AnyPgColumn>([]);

  for (let i = 0; i < fields.length; i++) {
    const column = table[fields[i]] as AnyPgColumn;
    map.set(fields[i].toString(), column);
  }

  return Object.fromEntries(map) as Pick<T, F>;
}

export async function logError(err: unknown, when: string, from: string | null) {
  let message = 'Unknown error';
  let osuJSResp: Response | undefined;
  let query: string | undefined;
  let queryParams: any[] | undefined;

  if (isOsuJSError(err)) {
    message = err.message;

    if (err.type === 'unexpected_response') {
      osuJSResp = err.response();
    }
  } else if (err instanceof postgres.PostgresError) {
    message = err.message;
    query = err.query;
    queryParams = err.parameters;
  } else if (err instanceof ValiError) {
    message = err.message;
  }

  message = `${message}. Error thrown when: ${when}`;
  console.error(`${new Date().toUTCString()} - ${from} - ${message}`);

  if (message.includes('Unknown error')) {
    console.log(err);
  }

  if (osuJSResp) {
    const data = await osuJSResp.text();
    console.log(`${osuJSResp.status} response from osu.js: ${data}`);
  }

  if (query && queryParams) {
    console.log(`Database query: ${query}`);
    console.log(`Query parameters: ${JSON.stringify(queryParams)}`);
  }

  if (err instanceof ValiError) {
    console.log(`Validation issues: ${JSON.stringify(err.issues)}`);
  }

  return `Internal server error. Error thrown when: ${when}`;
}

export async function apiError(err: unknown, when: string, route: { id: string | null }) {
  const message = await logError(err, when, route.id);
  error(500, message);
}

export function trpcUnknownError(err: unknown, when: string) {
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Internal server error. Error thrown when: ${when}`,
    cause: err
  });
}

export function catchUniqueConstraintError$(
  constraints: {
    name: string;
    message: string;
  }[]
) {
  return (err: unknown) => {
    if (!(err instanceof postgres.PostgresError) || err.code !== '23505') return;
    const constraint = err.message.split('"')[1];

    for (let i = 0; i < constraints.length; i++) {
      if (constraint === constraints[i].name) {
        return constraints[i].message;
      }
    }
  };
}

export function future(column: AnyPgColumn | SQL) {
  return gt(column as any, sql`now()`);
}

export function past(column: AnyPgColumn | SQL) {
  return lte(column as any, sql`now()`);
}

export function isDatePast(date: Date | number | null) {
  if (!date) return false;
  return new Date(date).getTime() <= new Date().getTime();
}

export function isDateFuture(date: Date | number | null) {
  if (!date) return false;
  return new Date(date).getTime() > new Date().getTime();
}

export function trgmSearch(searchStr: string, columns: [AnyPgColumn, ...AnyPgColumn[]]) {
  const q = sql`${searchStr} % (lower(${columns[0]})`;

  for (const col in columns.slice(1)) {
    q.append(sql` || ' ' || lower(${col})`);
  }

  q.append(sql`)`);
  return q;
}

export async function retryIfError<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      return await retryIfError(fn, retries - 1);
    } else {
      throw err;
    }
  }
}

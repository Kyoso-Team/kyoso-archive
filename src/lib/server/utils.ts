import env from '$lib/server/env';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';
import { error } from '@sveltejs/kit';
import { isOsuJSError } from 'osu-web.js';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { customAlphabet } from 'nanoid';
import { SQL, gt, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

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
 * Enable text search capabilities provided the table's columns and the search term (query)
 */
// export function textSearch(...columns: AnyColumn[]) {
//   let q = sql``;

//   for (let i = 0; i < columns.length - 1; i++) {
//     let sq = sql`lower(${columns[i]}) || ' ' || `;
//     q.append(sq);
//   }

//   let sq = sql`lower(${columns.at(-1)}) ilike `;
//   q.append(sq);

//   return {
//     query: (str: string) => {
//       let sq = sql`'${str}'`;
//       q.append(sq);
//       return q;
//     }
//   };
// }

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

  return message;
}

export async function apiError(err: unknown, when: string, route: { id: string | null }) {
  const message = await logError(err, when, route.id);
  error(500, message);
}

export function trpcUnknownError(err: unknown, when: string) {
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `500 - Internal Server Error. Error thrown when: ${when}`,
    cause: err
  });
}

export function trpcError(code: TRPC_ERROR_CODE_KEY, err: unknown, message: string) {
  const httpStatusCode = getHTTPStatusCodeFromError({ code } as TRPCError);
  const formattedCode = code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join();
  
  return new TRPCError({
    code,
    message: `${httpStatusCode} - ${formattedCode}. ${message}`,
    cause: err
  });
}

export function future(column: AnyPgColumn | SQL, ms?: boolean) {
  return ms
    ? gt(column as any, sql`(${new Date().getTime()})::bigint`)
    : gt(column as any, new Date());
}

export function past(column: AnyPgColumn | SQL, ms?: boolean) {
  return ms
    ? lte(column as any, sql`(${new Date().getTime()})::bigint`)
    : lte(column as any, new Date());
}

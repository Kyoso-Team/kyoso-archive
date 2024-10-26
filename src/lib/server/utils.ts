import { error } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import postgres from 'postgres';
import { env } from '$lib/server/env';
import { logError } from './error';
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

/** @deprecated */
export async function apiError(err: unknown, when: string, route: { id: string | null }) {
  await logError(err, when, route.id);
  error(500, `Internal server error. Error thrown when: ${when}`);
}

/** @deprecated */
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

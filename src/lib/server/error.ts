import postgres from 'postgres';
import { isOsuJSError } from 'osu-web.js';
import { error as sveltekitError } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import type { ErrorInside } from '$lib/types';

export class ServerError extends Error {
  public inside: ErrorInside;

  constructor(cause: unknown, inside: ErrorInside, message: string) {
    super(`Internal server error. Error thrown when: ${message}`);
    this.name = 'ServerError';
    this.cause = cause;
    this.inside = inside;
  }
}

/**
 * Throw an expected error
 * @throws {TRPCError | HttpError | Error}
 */
export function error(
  inside: ErrorInside,
  status: Lowercase<TRPC_ERROR_CODE_KEY>,
  message: string
): never {
  const statusNumber = getHTTPStatusCodeFromError({ code: status } as any);

  if (inside === 'trpc') {
    throw new TRPCError({
      message,
      code: status.toUpperCase() as TRPC_ERROR_CODE_KEY,
      cause: new ServerError(undefined, 'trpc', message)
    });
  }

  sveltekitError(statusNumber, message);
}

/**
 * Throw an unexpected error
 * @throws {ServerError}
 */
export function unexpectedServerError(
  error: unknown,
  inside: ErrorInside,
  errorOcurredWhen: string
) {
  throw new ServerError(error, inside, errorOcurredWhen);
}

export function catcher(inside: ErrorInside, errorOcurredWhen: string) {
  /**
   * @throws {ServerError}
   */
  return (error: unknown) => {
    throw new ServerError(error, inside, errorOcurredWhen);
  };
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
}

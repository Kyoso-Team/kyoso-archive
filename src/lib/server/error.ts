import { error as sveltekitError } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import type { ExpectedErrorInside, UnexpectedErrorInside } from '$types';

export class ServerError extends Error {
  public inside: UnexpectedErrorInside;

  constructor(cause: unknown, inside: UnexpectedErrorInside, message: string) {
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
export function error(inside: ExpectedErrorInside, status: Lowercase<TRPC_ERROR_CODE_KEY>, message: string): never {
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
export function unexpectedServerError(error: unknown, inside: UnexpectedErrorInside, errorOcurredWhen: string) {
  throw new ServerError(error, inside, errorOcurredWhen);
}

export function catcher(inside: UnexpectedErrorInside, errorOcurredWhen: string) {
  /**
   * @throws {ServerError}
   */
  return (error: unknown) => {
    throw new ServerError(error, inside, errorOcurredWhen);
  };
}

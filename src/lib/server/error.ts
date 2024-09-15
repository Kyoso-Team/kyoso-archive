import { error as sveltekitError } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

export class ServerError extends Error {
  public inside: 'trpc' | 'api' | 'layout' | 'page';

  constructor(cause: unknown, inside: 'trpc' | 'api' | 'layout' | 'page', message: string) {
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
export function error(inside: 'trpc' | 'sveltekit', status: Lowercase<TRPC_ERROR_CODE_KEY>, message: string): never {
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
export function unknownServerError(error: unknown, inside: 'trpc' | 'api' | 'layout' | 'page', errorOcurredWhen: string) {
  throw new ServerError(error, inside, errorOcurredWhen);
}

export function catcher(inside: 'trpc' | 'api' | 'layout' | 'page', errorOcurredWhen: string) {
  /**
   * @throws {ServerError}
   */
  return (error: unknown) => {
    throw new ServerError(error, inside, errorOcurredWhen);
  };
}

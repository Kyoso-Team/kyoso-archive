import { signJWT } from '$lib/server/utils';
import { t } from '$trpc';
import { router } from '$trpc/router';
import type { AuthSession } from '$types';

export async function createCaller(session?: AuthSession) {
  return t.createCallerFactory(router)({
    sessionCookie: session && signJWT(session),
    getClientAddress: () => '127.0.0.1'
  });
}

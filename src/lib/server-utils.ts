import { verifyJWT } from '$lib/jwt';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { SessionUser } from '$types';

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

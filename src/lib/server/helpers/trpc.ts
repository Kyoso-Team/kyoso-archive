import { trpcUnknownError } from '$lib/server/utils';
import { baseGetSession, baseGetStaffMember } from './base';
import type { AuthSession } from '$types';
import type { Cookies } from '@sveltejs/kit';

export async function getStaffMember<T extends AuthSession | undefined>(session: T, tournamentId: number) {
  return baseGetStaffMember<T>(session, tournamentId, {
    onGetStaffMemberError: async (err) => {
      throw trpcUnknownError(err, 'Getting the current user as a staff member');
    }
  });
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, true, mustBeSignedIn);
}
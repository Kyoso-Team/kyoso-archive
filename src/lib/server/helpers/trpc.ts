import { trpcUnknownError } from '$lib/server/utils';
import { baseGetSession, baseGetStaffMember } from './base';
import type { AuthSession } from '$types';
import type { Cookies } from '@sveltejs/kit';

export async function getStaffMember<T extends boolean>(
  session: AuthSession | undefined,
  tournamentId: number,
  mustBeStaffMember?: T
) {
  return baseGetStaffMember<T>(
    session,
    tournamentId,
    true,
    {
      onGetStaffMemberError: async (err) => {
        throw trpcUnknownError(err, 'Getting the current user as a staff member');
      }
    },
    mustBeStaffMember
  );
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, true, mustBeSignedIn);
}

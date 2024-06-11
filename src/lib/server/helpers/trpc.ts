import { trpcUnknownError } from '$lib/server/utils';
import { baseGetSession, baseGetStaffMember, baseGetTournament } from './base';
import type { AuthSession } from '$types';
import type { Cookies } from '@sveltejs/kit';
import type { Tournament, TournamentDates } from '$db';

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

export async function getTournament<
  MustExist extends boolean,
  TournamentFields extends (keyof typeof Tournament.$inferSelect)[] = [],
  DatesFields extends (keyof Omit<typeof TournamentDates.$inferSelect, 'tournamentId'>)[] = []
>(
  tournamentId: number | string,
  fields: {
    tournament?: TournamentFields;
    dates?: DatesFields;
  },
  tournamentMustExist?: MustExist
) {
  return baseGetTournament<MustExist, TournamentFields, DatesFields>(
    tournamentId,
    fields,
    true,
    {
      onGetTournamentError: async (err) => {
        throw trpcUnknownError(err, 'Getting the tournament');
      }
    },
    tournamentMustExist
  );
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, true, mustBeSignedIn);
}

import { pick, trpcUnknownError } from '$lib/server/utils';
import { baseGetSession, baseGetStaffMember, baseGetTournament } from './base';
import type { AuthSession } from '$types';
import type { Cookies } from '@sveltejs/kit';
import { Ban, db, type Tournament, type TournamentDates } from '$db';
import { eq } from 'drizzle-orm';

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

export async function isUserBanned(userId: number) {
  const { id } = await db
    .select(pick(Ban, ['id']))
    .from(Ban)
    .where(eq(Ban.issuedToUserId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  return !!id;
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, true, mustBeSignedIn);
}

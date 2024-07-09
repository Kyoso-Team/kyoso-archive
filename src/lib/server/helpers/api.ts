import * as v from 'valibot';
import { apiError } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import { baseGetSession, baseGetStaffMember, baseGetTournament } from './base';
import { Tournament, TournamentDates } from '$db';
import type { Cookies } from '@sveltejs/kit';
import type { AuthSession } from '$types';

export async function getStaffMember<T extends boolean>(
  session: AuthSession | undefined,
  tournamentId: number,
  route: { id: string | null },
  mustBeStaffMember?: T
) {
  return baseGetStaffMember<T>(
    session,
    tournamentId,
    false,
    {
      onGetStaffMemberError: async (err) => {
        throw await apiError(err, 'Getting the current user as a staff member', route);
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
  route: { id: string | null },
  tournamentMustExist?: MustExist
) {
  return baseGetTournament<MustExist, TournamentFields, DatesFields>(
    tournamentId,
    fields,
    false,
    {
      onGetTournamentError: async (err) => {
        throw await apiError(err, 'Getting the tournament', route);
      }
    },
    tournamentMustExist
  );
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, false, mustBeSignedIn);
}

export async function parseSearchParams<T extends Record<string, v.BaseSchema>>(
  url: URL,
  schemas: T,
  route: { id: string | null }
): Promise<{ [K in keyof T]: v.Output<T[K]> }> {
  const data: Record<string, any> = {};
  let currentKey = '';

  try {
    for (const key in schemas) {
      currentKey = key;
      const value = url.searchParams.get(key) || undefined;
      data[key] = v.parse(schemas[key], !isNaN(Number(value)) ? Number(value) : value);
    }
  } catch (err) {
    if (err instanceof v.ValiError) {
      const issue = (v.flatten(err.issues).root || [])[0];
      error(400, `Invalid input: ${currentKey} should ${issue}`);
    } else {
      throw await apiError(err, 'Parsing the URL search parameters', route);
    }
  }

  return data as any;
}

export async function parseRequestBody<T extends v.BaseSchema>(
  request: Request,
  schema: T,
  route: { id: string | null }
): Promise<v.Output<T>> {
  let body!: Record<string, any>;

  try {
    body = await request.json();
  } catch (err) {
    error(400, "Body is malformed or isn't JSON");
  }

  try {
    body = v.parse(schema, body);
  } catch (err) {
    if (err instanceof v.ValiError) {
      let str = 'Invalid input:\n';
      const issues = v.flatten(err.issues).nested;

      for (const key in issues) {
        str += `- body.${key} should ${issues[key]}\n`;
      }

      str = str.trimEnd();
      error(400, str);
    } else {
      throw await apiError(err, 'Parsing the JSON body', route);
    }
  }

  return body as any;
}

import * as v from 'valibot';
import { apiError } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import { baseGetSession, baseGetStaffMember } from './base';
import type { Cookies } from '@sveltejs/kit';
import type { AuthSession } from '$types';

export async function getStaffMember<T extends AuthSession | undefined>(session: T, tournamentId: number, route: { id: string | null; }) {
  return baseGetStaffMember<T>(session, tournamentId, {
    onGetStaffMemberError: async (err) => {
      throw await apiError(err, 'Getting the current user as a staff member', route);
    }
  });
}

export function getSession<T extends boolean>(
  cookies: Cookies,
  mustBeSignedIn?: T
): T extends true ? AuthSession : AuthSession | undefined {
  return baseGetSession<T>(cookies, false, mustBeSignedIn);
}

export async function parseSearchParams<T extends Record<string, v.BaseSchema>>(url: URL, schemas: T, route: { id: string | null }): Promise<{ [K in keyof T]: v.Output<T[K]> }> {
  const data: Record<string, any> = {};
  
  try {
    for (const key in schemas) {
      data[key] = v.parse(schemas[key], url.searchParams.get(key));
    }
  } catch (err) {
    if (err instanceof v.ValiError) {
      let str = 'Invalid input:\n';
      const issues = v.flatten(err.issues).nested;

      for (const key in issues) {
        str += `- Param "${key}" should ${issues[key]}\n`;
      }

      str = str.trimEnd();
      error(400, str);
    } else {
      throw await apiError(err, 'Parsing the URL search parameters', route);
    }
  }

  return data as any;
}

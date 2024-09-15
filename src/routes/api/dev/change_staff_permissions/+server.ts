import * as v from 'valibot';
import { env } from '$lib/server/env';
import { error } from '@sveltejs/kit';
import { getSession, getStaffMember, parseRequestBody } from '$lib/server/helpers/api';
import { StaffPermission } from '$db';
import { redis } from '$lib/services';
import { positiveIntSchema } from '$lib/schemas';
import type { RequestHandler } from './$types';

export const PATCH = (async ({ cookies, route, request }) => {
  if (env.NODE_ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession(cookies, true);
  const { tournamentId, permissions } = await parseRequestBody(
    request,
    v.object({
      tournamentId: positiveIntSchema,
      permissions: v.array(v.picklist(StaffPermission.enumValues))
    }),
    route
  );
  const staffMember = await getStaffMember(session, tournamentId, route, true);

  const p = redis.pipeline();
  p.set(`staff_permissions:${staffMember.id}`, JSON.stringify(permissions));
  p.persist(`staff_permissions:${staffMember.id}`);
  await p.exec();

  return new Response('Successfully updated staff permissions');
}) satisfies RequestHandler;

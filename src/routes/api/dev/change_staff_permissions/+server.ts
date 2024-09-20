import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { StaffPermission } from '$db';
import { getSession, getStaffMember } from '$lib/server/context';
import { env } from '$lib/server/env';
import { parseRequestBody } from '$lib/server/request';
import { redis } from '$lib/server/services';
import { positiveIntSchema } from '$lib/validation';
import type { RequestHandler } from './$types';

export const PATCH = (async ({ cookies, request }) => {
  if (env.NODE_ENV !== 'development') {
    throw error(403, 'This endpoint is only for use within a development environment');
  }

  const session = getSession('api', cookies, true);
  const { tournamentId, permissions } = await parseRequestBody(
    'api',
    request,
    v.object({
      tournamentId: positiveIntSchema,
      permissions: v.array(v.picklist(StaffPermission.enumValues))
    })
  );
  const staffMember = await getStaffMember('api', session, tournamentId, true);

  const p = redis.pipeline();
  p.set(`staff_permissions:${staffMember.id}`, JSON.stringify(permissions));
  p.persist(`staff_permissions:${staffMember.id}`);
  await p.exec();

  return new Response('Successfully updated staff permissions');
}) satisfies RequestHandler;

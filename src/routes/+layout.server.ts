import env from '$lib/env.server';
import { getSession } from '$lib/server/helpers/api';
import { redis } from '$lib/server/redis';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies);
  let isUserOwner = env.OWNER === session?.osu?.id;

  if (env.NODE_ENV === 'development' && session) {
    const isOwner = await redis.get<boolean>(`owner:${session.userId}`);
    isUserOwner = isOwner !== null ? isOwner : isUserOwner;
  }

  return { session, isUserOwner };
}) satisfies LayoutServerLoad;

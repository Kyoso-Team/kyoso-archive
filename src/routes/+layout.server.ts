import env from '$lib/server/env';
import { getSession } from '$lib/server/helpers/api';
import { redis } from '$lib/server/redis';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession(cookies);
  const isDevEnv = env.ENV === 'development';
  let isUserOwner = env.OWNER === session?.osu?.id;

  if (isDevEnv && session) {
    const isOwner = await redis.get<boolean>(`owner:${session.userId}`);
    isUserOwner = isOwner !== null ? isOwner : isUserOwner;
  }

  return { session, isDevEnv, isUserOwner };
}) satisfies LayoutServerLoad;

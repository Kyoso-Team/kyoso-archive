import { getSession } from '$lib/server/context';
import { env } from '$lib/server/env';
import { redis } from '$lib/server/services';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
  const session = getSession('layout', cookies);
  let isUserOwner = env.OWNER === session?.osu?.id;

  if (env.NODE_ENV === 'development' && session) {
    const isOwner = await redis.get<boolean>(`owner:${session.userId}`);
    isUserOwner = isOwner !== null ? isOwner : isUserOwner;
  }

  return { session, isUserOwner };
}) satisfies LayoutServerLoad;

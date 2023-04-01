import { getCaller } from '$trpc/caller';
import type { SessionUser } from '$types';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
  const caller = await getCaller(event);
  let user: SessionUser | undefined;

  if (event.cookies.get('session')) {
    user = await caller.auth.updateUser();
  }

  return { user };
}) satisfies LayoutServerLoad;

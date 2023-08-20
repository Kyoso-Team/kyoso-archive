import { getCaller } from '$trpc/caller';
import { redirect } from '@sveltejs/kit';
import type { SessionUser } from '$types';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
  const caller = await getCaller(event);
  let user: SessionUser | undefined;

  if (event.cookies.get('session')) {
    try {
      user = await caller.auth.updateUser();
    } catch (e) {
      console.error(e);
      throw redirect(302, '/');
    }
  }

  return { user };
}) satisfies LayoutServerLoad;

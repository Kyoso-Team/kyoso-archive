import { redirect } from '@sveltejs/kit';
import type { AuthUser } from '$types';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
  let user: AuthUser | undefined;

  if (event.cookies.get('session')) {
    console.log('a');
  }

  return { user };
}) satisfies LayoutServerLoad;

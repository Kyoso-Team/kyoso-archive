import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies }) => {
  const redirectUri = url.searchParams.get('redirect_uri') || undefined;

  cookies.delete('session', {
    path: '/'
  });

  if (redirectUri) {
    redirect(302, decodeURI(redirectUri));
  }

  redirect(302, '/');
}) satisfies RequestHandler;

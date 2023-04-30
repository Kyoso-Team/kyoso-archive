import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ params: { tournamentId } }) => {
  throw redirect(302, `/tournament/${tournamentId}/manage/settings/general`);
}) satisfies RequestHandler;

import { redirect } from '@sveltejs/kit';
import { pick } from '$lib/server/utils';
import { db } from '$lib/server/services';
import { User } from '$db';
import { eq } from 'drizzle-orm';
import { catcher, error } from '$lib/server/error';
import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
  const osuUserId = isNaN(Number(params.osu_user_id)) ? 0 : Number(params.osu_user_id);
  const user = await db
    .select(pick(User, ['id']))
    .from(User)
    .where(eq(User.osuUserId, osuUserId))
    .limit(1)
    .then((rows) => rows.at(0))
    .catch(catcher('api', 'Getting the user'));

  if (!user) {
    error('api', 'not_found', 'User not found');
  }

  redirect(302, `/user/${user.id}`);
}) satisfies RequestHandler;

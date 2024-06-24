import { error, redirect } from '@sveltejs/kit';
import { pick, apiError } from '$lib/server/utils';
import { User, db } from '$db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET = (async ({ params, route }) => {
  const osuUserId = isNaN(Number(params.osu_user_id)) ? 0 : Number(params.osu_user_id);
  let user!: Pick<typeof User.$inferSelect, 'id'> | undefined;

  try {
    user = await db
      .select(pick(User, ['id']))
      .from(User)
      .where(eq(User.osuUserId, osuUserId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch (err) {
    throw await apiError(err, 'Getting the user', route);
  }

  if (!user) {
    error(404, 'User not found');
  }

  redirect(302, `/user/${user.id}`);
}) satisfies RequestHandler;

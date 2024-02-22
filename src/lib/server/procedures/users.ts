import * as v from 'valibot';
import { db, Session, User } from '$db';
import { eq } from 'drizzle-orm';
import { t } from '$trpc';
import { getSession, pick, trpcUnknownError } from '$lib/server-utils';
import { customAlphabet } from 'nanoid';
import { wrap } from '@typeschema/valibot';
import { idSchema } from '$lib/schemas';

const updateSelf = t.procedure.mutation(async ({ ctx }) => {
  const session = getSession(ctx.cookies, true);

  let user!: Pick<typeof User.$inferSelect, 'apiKey'>;

  try {
    user = await db
      .update(User)
      .set({
        apiKey: customAlphabet(
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          24
        )()
      })
      .where(eq(User.id, session.userId))
      .returning(pick(User, ['apiKey']))
      .then((rows) => rows[0]);
  } catch (err) {
    throw trpcUnknownError(err, 'Updating the user');
  }

  return user;
});

const deleteSession = t.procedure
  .input(
    wrap(
      v.object({
        sessionId: idSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    getSession(ctx.cookies, true);

    try {
      await db.delete(Session).where(eq(Session.id, input.sessionId));
    } catch (err) {
      throw trpcUnknownError(err, 'Deleting the session');
    }
  });

export const usersRouter = t.router({
  updateSelf,
  deleteSession
});

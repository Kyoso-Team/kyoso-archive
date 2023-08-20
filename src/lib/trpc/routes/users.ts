import db from '$db';
import { dbUser } from '$db/schema';
import { eq } from 'drizzle-orm';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { getStoredUser, isAllowed, select, findFirstOrThrow } from '$lib/server-utils';
import { getUser } from '$trpc/middleware';

export const usersRouter = t.router({
  changeDiscordVisibility: t.procedure.input(z.boolean()).mutation(async ({ ctx, input }) => {
    let storedUser = getStoredUser(ctx, true);

    let user = await tryCatch(async () => {
      return findFirstOrThrow(
        await db
          .update(dbUser)
          .set({
            showDiscordTag: input
          })
          .where(eq(dbUser.id, storedUser.id))
          .returning(select(dbUser, [
            'showDiscordTag'
          ])),
        'user'
      );
    }, "Can't update user data.");

    return user.showDiscordTag === input;
  }),

  changeAdminStatus: t.procedure
    .use(getUser)
    .input(
      z.object({
        id: z.number(),
        toAdmin: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(ctx.user.isAdmin, `delete user with id ${input}`);

      let user = await tryCatch(async () => {
        return findFirstOrThrow(
          await db
            .update(dbUser)
            .set({
              isAdmin: input.toAdmin
            })
            .where(eq(dbUser.id, input.id))
            .returning(select(dbUser, [
              'isAdmin'
            ])),
          'user'
        );
      }, "Can't change admin status of user.");

      return user.isAdmin === input.toAdmin;
    }),

  /**
   * @remarks This returns the supposedly deleted user, not a confirmation that the user got deleted
   */
  deleteUser: t.procedure
    .use(getUser)
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      isAllowed(ctx.user.isAdmin, `delete user with id ${input}`);

      let user = await tryCatch(async () => {
        return findFirstOrThrow(
          await db
            .delete(dbUser)
            .where(eq(dbUser.id, input))
            .returning(select(dbUser, [
              'id',
              'osuUsername'
            ])),
            'user'
        );
      }, "Can't delete user.");

      return user;
    })
});

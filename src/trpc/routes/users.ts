import { db } from '$db';
import { User } from '$db/schema';
import { eq } from 'drizzle-orm';
import { t } from '$trpc';
import { getSession, pick, trpcError } from '$lib/server-utils';
import { customAlphabet } from 'nanoid';

const updateSelf = t
  .procedure
  .mutation(async ({ ctx }) => {
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
      throw trpcError(err, 'Updating the user');
    }

    return user;
  });

export const usersRouter = t.router({
  updateSelf
  // changeDiscordVisibility: t.procedure.input(z.boolean()).mutation(async ({ ctx, input }) => {
  //   let storedUser = getSession(ctx, true);

  //   let user = await tryCatch(async () => {
  //     return findFirstOrThrow(
  //       await db
  //         .update(User)
  //         .set({
  //           showDiscordTag: input
  //         })
  //         .where(eq(User.id, storedUser.id))
  //         .returning(pick(User, ['showDiscordTag'])),
  //       'user'
  //     );
  //   }, "Can't update user data.");

  //   return user.showDiscordTag === input;
  // }),

  // changeAdminStatus: t.procedure
  //   .use(getUser)
  //   .input(
  //     z.object({
  //       id: z.number(),
  //       toAdmin: z.boolean()
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     isAllowed(ctx.user.isAdmin, `delete user with id ${input}`);

  //     let user = await tryCatch(async () => {
  //       return findFirstOrThrow(
  //         await db
  //           .update(User)
  //           .set({
  //             isAdmin: input.toAdmin
  //           })
  //           .where(eq(User.id, input.id))
  //           .returning(pick(User, ['isAdmin'])),
  //         'user'
  //       );
  //     }, "Can't change admin status of user.");

  //     return user.isAdmin === input.toAdmin;
  //   }),

  // /**
  //  * @remarks This returns the supposedly deleted user, not a confirmation that the user got deleted
  //  */
  // deleteUser: t.procedure
  //   .use(getUser)
  //   .input(z.number())
  //   .mutation(async ({ ctx, input }) => {
  //     isAllowed(ctx.user.isAdmin, `delete user with id ${input}`);

  //     let user = await tryCatch(async () => {
  //       return findFirstOrThrow(
  //         await db
  //           .delete(User)
  //           .where(eq(User.id, input))
  //           .returning(pick(User, ['id', 'osuUsername'])),
  //         'user'
  //       );
  //     }, "Can't delete user.");

  //     return user;
  //   })
});

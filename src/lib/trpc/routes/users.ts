import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { getStoredUser, isAllowed } from '$lib/server-utils';
import { getUser } from '$trpc/middleware';

export const usersRouter = t.router({
  changeDiscordVisibility: t.procedure.input(z.boolean()).mutation(async ({ ctx, input }) => {
    let storedUser = getStoredUser(ctx, true);

    let user = await tryCatch(async () => {
      return await prisma.user.update({
        where: {
          id: storedUser.id
        },
        data: {
          showDiscordTag: input
        }
      });
    }, "Can't update user data.");

    return user.showDiscordTag === input;
  }),

  changeAdminStatus: t.procedure
    .use(getUser)
    .input(z.object({
      id: z.number(),
      toAdmin: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin,
        `delete user with id ${input}`
      );

      let user = await tryCatch(async () => {
        return await prisma.user.update({
          where: {
            id: input.id
          },
          data: {
            isAdmin: input.toAdmin
          }
        });
      }, "Can't change admin status of user.");
  
      return user.isAdmin === input.toAdmin;
    }),

  /**
   * @remarks This returns the supposedly deleted user, not a confirmation that the user got deleted
   */
  deleteUser: t.procedure.use(getUser).input(z.number()).mutation(async ({ ctx, input }) => {
    isAllowed(
      ctx.user.isAdmin,
      `delete user with id ${input}`
    );

    let user = await tryCatch(async () => {
      return await prisma.user.delete({
        where: {
          id: input
        }
      });
    }, "Can't delete user.");
    
    return user;
  })
});

import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { getStoredUser } from '$lib/server-utils';

export const usersRouter = t.router({
  changeDiscordVisibility: t.procedure.input(z.boolean()).query(async ({ ctx, input }) => {
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
  })
});

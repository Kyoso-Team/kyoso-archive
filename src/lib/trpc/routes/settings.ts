import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { verifyJWT } from '$lib/jwt';
import type { SessionUser } from '$types';
import { TRPCError } from '@trpc/server';

export const settingsRouter = t.router({
	changeDiscordVisibility: t.procedure.input(z.boolean()).query(async ({ input, ctx }) => {
		let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));

		if (!storedUser) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid user cookie.'
      });
    }
		
		let user = await tryCatch(async () => {
			return await prisma.user.update({
				where: {
          id: storedUser?.id
        },
				data: {
					showDiscordTag: input
				}
			});
    }, "Can't update user data.");

		return user.showDiscordTag === input
	})
})

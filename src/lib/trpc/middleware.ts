import prisma from '$prisma';
import { verifyJWT } from '$lib/jwt';
import { t } from '$trpc';
import { TRPCError } from '@trpc/server';
import type { SessionUser } from '$types';
import type { Context } from '$trpc/context';

function getStoredUserHelper(ctx: Context) {
  if (!ctx.cookies.get('session')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User isn\'t logged in'
    });
  }

  return verifyJWT<SessionUser>(ctx.cookies.get('session')) as SessionUser;
}

export const getStoredUser = t.middleware(({ ctx, next }) => {
  return next({
    ctx: {
      user: getStoredUserHelper(ctx)
    }
  });
});

export const getUser = t.middleware(async({ ctx, next }) => {
  let storedUser = getStoredUserHelper(ctx);
  let user = await prisma.user.findUniqueOrThrow({
    where: {
      id: storedUser.id
    },
    select: {
      id: true,
      isAdmin: true,
      osuUserId: true,
      osuUsername: true,
      discordUserId: true,
      discordDiscriminator: true,
      freeComponentsLeft: true,
      osuAccessToken: true
    }
  });

  return next({
    ctx: {
      user
    }
  });
});
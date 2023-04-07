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
      osuAccessToken: true,
      asStaffMember: {
        select: {
          tournamentId: true,
          roles: {
            select: {
              permissions: true
            }
          }
        }
      }
    }
  });

  return next({
    ctx: {
      user
    }
  });
});

export const getUploadInfo = t.middleware(async({ ctx, next }) => {
  let formData = await ctx.request.formData()
  let img = formData.get("file")
  let uploadType = formData.get("uploadType")
  let targetType = formData.get("targetType")
  let targetId = formData.get("targetId")

  if (!img || !(img as File).size) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No file is trying to be uploaded"
    });
  }
  if (!uploadType || !targetType || !targetId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Trying to upload without specifying why"
    });
  }
  if (isNaN(+targetId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The ID of the target is not a number"
    });
  }

  return next({
    ctx: {
      uploadInfo: {
        img: img as File,
        uploadType: uploadType as string,
        targetType: targetType as string,
        targetId: +targetId as number
      }
    }
  })
})

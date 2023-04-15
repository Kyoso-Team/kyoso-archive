import prisma from '$prisma';
import { verifyJWT } from '$lib/jwt';
import { t, tryCatch } from '$trpc';
import { TRPCError } from '@trpc/server';
import type { SessionUser } from '$types';
import type { Context } from '$trpc/context';
import { z } from 'zod';

function getStoredUserHelper(ctx: Context) {
  if (!ctx.cookies.get('session')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: "User isn't logged in."
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

export const getUser = t.middleware(async ({ ctx, next }) => {
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
      freeServicesLeft: true,
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
  let upload = formData.get("file")
  let uploadType = formData.get("uploadType")
  let targetType = formData.get("targetType")
  let targetId = formData.get("targetId")

  if (!upload || !(upload as File).size) {
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
        upload: upload as File,
        uploadType: uploadType as string,
        targetType: targetType as string,
        targetId: +targetId as number
      }
    }
  })
})


export const getUserAsStaff = t.middleware(async ({ ctx, next, input }) => {
  let parse = z.object({
    tournamentId: z.number().int()
  }).safeParse(input);

  if (!parse.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '"tournamentId" is undefined'
    });
  }

  let parsed = parse.data;
  let storedUser = getStoredUserHelper(ctx);

  let user = await prisma.user.findUniqueOrThrow({
    where: {
      id: storedUser.id
    },
    select: {
      id: true,
      isAdmin: true,
      osuUserId: true
    }
  });

  let tournament = await tryCatch(
    async () => {
      return await prisma.tournament.findUniqueOrThrow({
        where: {
          id: parsed.tournamentId
        },
        select: {
          id: true,
          team: {
            select: {
              id: true
            }
          },
          solo: {
            select: {
              id: true
            }
          }
        }
      });
    },
    `Couldn't find tournament with ID ${parse.data.tournamentId}.`
  );


  let staffMember = await tryCatch(
    async () => {
      return await prisma.staffMember.findUniqueOrThrow({
        where: {
          userId_tournamentId: {
            userId: user.id,
            tournamentId: tournament.id
          }
        },
        select: {
          id: true,
          roles: {
            select: {
              permissions: true
            }
          }
        }
      });
    },
    `Couldn't find Sstaff member with user ID ${user.id} in tournament with ID ${tournament.id}.`
  );

  return next({
    ctx: {
      user,
      tournament,
      staffMember
    }
  });
});
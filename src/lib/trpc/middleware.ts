import prisma from '$prisma';
import { verifyJWT } from '$lib/jwt';
import { t, tryCatch } from '$trpc';
import { TRPCError } from '@trpc/server';
import type { SessionUser } from '$types';
import type { Context } from '$trpc/context';
import { z } from 'zod';
import type { BanOrder, TournamentService, TournamentType, WinCondition } from '@prisma/client';

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
      osuAccessToken: true
    }
  });

  return next({
    ctx: {
      user
    }
  });
});

export const getUserAsStaff = t.middleware(async ({ ctx, next, rawInput }) => {
  let parse = z
    .object({
      tournamentId: z.number().int()
    })
    .safeParse(rawInput);

  if (!parse.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '"tournamentId" is invalid'
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
      osuUserId: true,
      osuAccessToken: true
    }
  });

  let tournament = await tryCatch(async () => {
    return await prisma.tournament.findUniqueOrThrow({
      where: {
        id: parsed.tournamentId
      },
      select: {
        id: true,
        concludesOn: true,
        services: true,
        type: true,
        teamSize: true,
        teamPlaySize: true
      }
    });
  }, `Couldn't find tournament with ID ${parsed.tournamentId}.`);

  let staffMember = await tryCatch(async () => {
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
  }, `Couldn't find staff member with user ID ${user.id} in tournament with ID ${tournament.id}.`);

  return next({
    ctx: {
      user,
      tournament,
      staffMember
    }
  });
});

export const getUserAsStaffWithRound = getUserAsStaff.unstable_pipe(
  async ({ ctx, next, rawInput }) => {
    let parse = z
      .object({
        roundId: z.number().int()
      })
      .safeParse(rawInput);

    if (!parse.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '"roundId" is invalid'
      });
    }

    let parsed = parse.data;

    let round = await tryCatch(async () => {
      return await prisma.round.findUniqueOrThrow({
        where: {
          id: parsed.roundId
        },
        select: {
          id: true,
          mappoolState: true,
          publishStats: true
        }
      });
    }, `Couldn't find round with ID ${parsed.roundId}.`);

    return next({
      ctx: {
        ...ctx,
        round
      }
    });
  }
);

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
      osuUserId: true
    }
  });

  let tournament = await tryCatch(async () => {
    return await prisma.tournament.findUniqueOrThrow({
      where: {
        id: parsed.tournamentId
      },
      select: {
        id: true
      }
    });
  }, `Couldn't find tournament with ID ${parse.data.tournamentId}.`);

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

async function getTournamentHelper<T extends 'general' | 'dates' | 'ref'>(
  input: unknown,
  dataType: T
) {
  let parse = z
    .object({
      tournamentId: z.number().int()
    })
    .safeParse(input);
  
  if (!parse.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '"tournamentId" is invalid'
    });
  }

  let parsed = parse.data;

  let tournament = await tryCatch(async () => {
    return await prisma.tournament.findUniqueOrThrow({
      where: {
        id: parsed.tournamentId
      },
      select: dataType === 'general'
        ? {
          lowerRankRange: true,
          upperRankRange: true,
          teamSize: true,
          teamPlaySize: true,
          useBWS: true,
          type: true,
          services: true
        } : dataType === 'dates'
          ? {
            goPublicOn: true,
            concludesOn: true,
            playerRegsOpenOn: true,
            playerRegsCloseOn: true,
            staffRegsOpenOn: true,
            staffRegsCloseOn: true
          } : {
            doublePickAllowed: true,
            doubleBanAllowed: true,
            alwaysForceNoFail: true,
            banOrder: true,
            winCondition: true
          }
    });
  }, `Couldn't find tournament with ID ${parse.data.tournamentId}.`);

  return tournament as T extends 'general' ? {
    lowerRankRange: number;
    upperRankRange: number;
    teamSize: number;
    teamPlaySize: number;
    useBWS: boolean;
    type: TournamentType;
    services: TournamentService[];
  } : T extends 'dates' ? {
    goPublicOn: Date | null;
    concludesOn: Date | null;
    playerRegsOpenOn: Date | null;
    playerRegsCloseOn: Date | null;
    staffRegsOpenOn: Date | null;
    staffRegsCloseOn: Date | null;
  } : {
    doublePickAllowed: boolean;
    doubleBanAllowed: boolean;
    alwaysForceNoFail: boolean;
    banOrder: BanOrder;
    winCondition: WinCondition;
  };
}

export const getTournamentGeneralSettings = getUserAsStaff.unstable_pipe(async ({ ctx, next, rawInput }) => {
  let tournament = await getTournamentHelper(rawInput, 'general');

  return next({
    ctx: {
      ... ctx,
      tournament: {
        ... tournament,
        id: ctx.tournament.id
      }
    }
  });
});

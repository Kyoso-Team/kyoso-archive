// import db from '$db';
// import {
//   User,
//   dbTournament,
//   dbRound,
//   dbStaffMemberToStaffRole,
//   dbStaffRole,
//   dbStaffMember
// } from '$db/schema';
// import { eq, and } from 'drizzle-orm';
// import { z } from 'zod';
// import { verifyJWT } from '$lib/jwt';
import { t } from '$trpc';
import { TRPCError } from '@trpc/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getEnv } from '../../../../scripts/env';
// import { findFirstOrThrow, pick } from '$lib/server/utils';
// import type { SessionUser } from '$types';
// import type { Context } from '$trpc/context';

// function getStoredUserHelper(ctx: Context) {
//   if (!ctx.cookies.get('session')) {
//     throw new TRPCError({
//       code: 'UNAUTHORIZED',
//       message: "User isn't logged in."
//     });
//   }

//   return verifyJWT<SessionUser>(ctx.cookies.get('session')) as SessionUser;
// }

// export const getStoredUser = t.middleware(({ ctx, next }) => {
//   return next({
//     ctx: {
//       user: getStoredUserHelper(ctx)
//     }
//   });
// });

// export const getUser = t.middleware(async ({ ctx, next }) => {
//   let storedUser = getStoredUserHelper(ctx);
//   let user = findFirstOrThrow(
//     await db
//       .select(
//         pick(User, [
//           'id',
//           'isAdmin',
//           'osuUserId',
//           'osuUsername',
//           'discordUserId',
//           'discordDiscriminator',
//           'freeServicesLeft',
//           'osuAccessToken'
//         ])
//       )
//       .from(User)
//       .where(eq(User.id, storedUser.id)),
//     'user'
//   );

//   return next({
//     ctx: {
//       user
//     }
//   });
// });

// export const getUserAsStaff = t.middleware(async ({ ctx, next, rawInput }) => {
//   let parse = z
//     .object({
//       tournamentId: z.number().int()
//     })
//     .safeParse(rawInput);

//   if (!parse.success) {
//     throw new TRPCError({
//       code: 'BAD_REQUEST',
//       message: '"tournamentId" is invalid'
//     });
//   }

//   let parsed = parse.data;
//   let storedUser = getStoredUserHelper(ctx);

//   let user = findFirstOrThrow(
//     await db
//       .select(pick(User, ['id', 'isAdmin', 'osuUserId', 'osuAccessToken']))
//       .from(User)
//       .where(eq(User.id, storedUser.id)),
//     'user'
//   );

//   let tournament = await tryCatch(async () => {
//     return findFirstOrThrow(
//       await db
//         .select(
//           pick(dbTournament, [
//             'id',
//             'concludesOn',
//             'services',
//             'type',
//             'teamSize',
//             'teamPlaySize'
//           ])
//         )
//         .from(dbTournament)
//         .where(eq(dbTournament.id, parsed.tournamentId)),
//       'tournament'
//     );
//   }, `Couldn't find tournament with ID ${parsed.tournamentId}.`);

//   let staffMember = await tryCatch(async () => {
//     let data = await db
//       .select({
//         staffMember: {
//           id: dbStaffMemberToStaffRole.staffMemberId
//         },
//         staffRole: {
//           permissions: dbStaffRole.permissions
//         }
//       })
//       .from(dbStaffMemberToStaffRole)
//       .where(and(eq(dbStaffMember.userId, user.id), eq(dbStaffMember.tournamentId, tournament.id)))
//       .innerJoin(dbStaffMember, eq(dbStaffMember.id, dbStaffMemberToStaffRole.staffMemberId))
//       .innerJoin(dbStaffRole, eq(dbStaffRole.id, dbStaffMemberToStaffRole.staffRoleId));

//     if (!data[0]) {
//       throw new Error("Couldn't find staff member");
//     }

//     return {
//       id: data[0].staffMember.id,
//       roles: data.map(({ staffRole }) => staffRole)
//     };
//   }, `Couldn't find staff member with user ID ${user.id} in tournament with ID ${tournament.id}.`);

//   return next({
//     ctx: {
//       user,
//       tournament,
//       staffMember
//     }
//   });
// });

// export const getUserAsStaffWithRound = getUserAsStaff.unstable_pipe(
//   async ({ ctx, next, rawInput }) => {
//     let parse = z
//       .object({
//         roundId: z.number().int()
//       })
//       .safeParse(rawInput);

//     if (!parse.success) {
//       throw new TRPCError({
//         code: 'BAD_REQUEST',
//         message: '"roundId" is invalid'
//       });
//     }

//     let parsed = parse.data;

//     let round = await tryCatch(async () => {
//       return findFirstOrThrow(
//         await db
//           .select(pick(dbRound, ['id', 'mappoolState']))
//           .from(dbRound)
//           .where(eq(dbRound.id, parsed.roundId)),
//         'round'
//       );
//     }, `Couldn't find round with ID ${parsed.roundId}.`);

//     return next({
//       ctx: {
//         ...ctx,
//         round
//       }
//     });
//   }
// );

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: getEnv().UPSTASH_REDIS_REST_URL,
    token: getEnv().UPSTASH_REDIS_REST_TOKEN
  }),
  limiter: Ratelimit.slidingWindow(1, '10 s')
});

export const rateLimitMiddleware = t.middleware(
  async ({ path, next, ctx: { getClientAddress } }) => {
    const ip = getClientAddress();
    const identifier = `${path}-${ip}`;

    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later!'
      });
    }

    return next();
  }
);

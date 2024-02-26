// import soloRouter from './solo';
// import teamRouter from './team';
// // import db from '$db';
// // import { dbPlayer, dbTeam, dbTournament } from '$db/schema';
// // import { eq, and } from 'drizzle-orm';
// // import { z } from 'zod';
// // import { t, tryCatch } from '$trpc';
// // import { getUserAsStaff, getStoredUser } from '$trpc/middleware';
// // import { availabilitySchema, withTournamentSchema } from '$lib/schemas';
// // import { forbidIf, isAllowed, select, findFirstOrThrow } from '$lib/server/utils';
// // import { Client } from 'osu-web.js';
// // import { getDiscordUser } from '$trpc/helpers';
// // import { calc, hasPerms } from '$lib/utils';
// import { t } from '$trpc';

// export const regsRouter = t.router({
//   solo: soloRouter,
//   team: teamRouter
//   // Needs rework
//   // updateOwnAvailability: t.procedure
//   //   .use(getStoredUser)
//   //   .input(
//   //     withTournamentSchema.extend({
//   //       availability: availabilitySchema
//   //     })
//   //   )
//   //   .mutation(async ({ ctx, input }) => {
//   //     let { tournamentId, availability } = input;

//   //     let tournament = await tryCatch(async () => {
//   //       return findFirstOrThrow(
//   //         await db
//   //           .select(select(dbTournament, [
//   //             'id',
//   //             'concludesOn'
//   //           ]))
//   //           .from(dbTournament)
//   //           .where(eq(dbTournament.id, input.tournamentId)),
//   //         'tournament'
//   //       );
//   //     }, `Can't find tournament with ID ${input.tournamentId}.`);

//   //     forbidIf.hasConcluded(tournament);

//   //     await tryCatch(async () => {
//   //       await db
//   //         .update(dbPlayer)
//   //         .set({
//   //           availability
//   //         })
//   //         .where(and(
//   //           eq(dbPlayer.tournamentId, tournamentId),
//   //           eq(dbPlayer.userId, ctx.user.id)
//   //         ));
//   //     }, `Can't update player with user ID ${ctx.user.id} in tournament of ID ${tournamentId}.`);
//   //   }),
//   // updatePlayer: t.procedure
//   //   .use(getUserAsStaff)
//   //   .input(
//   //     withTournamentSchema.extend({
//   //       playerId: z.number().int()
//   //     })
//   //   )
//   //   .mutation(async ({ ctx, input }) => {
//   //     isAllowed(
//   //       hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_regs']),
//   //       `update user data for player of ID ${input.playerId}`
//   //     );

//   //     forbidIf.doesntIncludeService(ctx.tournament, 'registrations');
//   //     forbidIf.hasConcluded(ctx.tournament);

//   //     let { discordUserId, osuUserId, badgeCount } = await tryCatch(async () => {
//   //       let { user, badgeCount } = await prisma.player.findFirstOrThrow({
//   //         where: {
//   //           id: input.playerId
//   //         },
//   //         select: {
//   //           badgeCount: true,
//   //           user: {
//   //             select: {
//   //               osuUserId: true,
//   //               discordUserId: true
//   //             }
//   //           }
//   //         }
//   //       });

//   //       return {
//   //         ...user,
//   //         badgeCount
//   //       };
//   //     }, `Can't find player of ID ${input.playerId}.`);

//   //     let osuApi = new Client(ctx.user.osuAccessToken);

//   //     let osuUserPromise = osuApi.users.getUser(osuUserId, {
//   //       query: {
//   //         key: 'id'
//   //       },
//   //       urlParams: {
//   //         mode: 'osu'
//   //       }
//   //     });
//   //     let discordUserPromise = getDiscordUser(discordUserId);

//   //     let [osuUser, discordUser] = await tryCatch(async () => {
//   //       return await Promise.all([osuUserPromise, discordUserPromise]);
//   //     }, `Can't fetch osu! and/or Discord user data for player of ID ${input.playerId}.`);

//   //     await tryCatch(async () => {
//   //       await prisma.user.update({
//   //         where: {
//   //           osuUserId: osuUser.id
//   //         },
//   //         data: {
//   //           osuUsername: osuUser.username,
//   //           discordUsername: discordUser.username,
//   //           discordDiscriminator: discordUser.discriminator
//   //         },
//   //         select: {
//   //           id: true
//   //         }
//   //       });

//   //       let { team } = await prisma.player.update({
//   //         where: {
//   //           id: input.playerId
//   //         },
//   //         data: {
//   //           rank: osuUser.statistics.global_rank,
//   //           bwsRank: calc.bwsRank(osuUser.statistics.global_rank, badgeCount)
//   //         },
//   //         select: {
//   //           team: {
//   //             select: {
//   //               id: true
//   //             }
//   //           }
//   //         }
//   //       });

//   //       if (!team) return;

//   //       let {
//   //         _avg: { rank, bwsRank }
//   //       } = await prisma.player.aggregate({
//   //         where: {
//   //           teamId: team.id
//   //         },
//   //         _avg: {
//   //           rank: true,
//   //           bwsRank: true
//   //         }
//   //       });

//   //       if (!rank || !bwsRank) return;

//   //       await prisma.team.update({
//   //         where: {
//   //           id: team.id
//   //         },
//   //         data: {
//   //           avgRank: rank,
//   //           avgBwsRank: bwsRank
//   //         },
//   //         select: {
//   //           id: true
//   //         }
//   //       });
//   //     }, `Can't update user data for player of ID ${input.playerId}.`);
//   //   })
// });

// import db from '$db';
// import paypalClient, { money } from '$lib/paypal';
// import paypal from '@paypal/checkout-server-sdk';
// import {
//   dbPurchase,
//   dbStaffMember,
//   dbStaffMemberToStaffRole,
//   dbStaffRole,
//   dbTournament,
//   User
// } from '$db/schema';
// import { eq, sql } from 'drizzle-orm';
// import { z } from 'zod';
// import { t, tryCatch } from '$trpc';
// import { getUser, getUserAsStaff } from '$trpc/middleware';
// import { services } from '$lib/constants';
// import { TRPCError } from '@trpc/server';
// import { findFirstOrThrow, isAllowed, pick } from '$lib/server-utils';
// import { hasPerms, hasTournamentConcluded } from '$lib/utils';
// import { whereIdSchema } from '$lib/schemas';
// import type { PayPalOrder } from '$types';
// import type { AmountBreakdown } from '@paypal/checkout-server-sdk/lib/payments/lib';

// const servicesSchema = z
//   .array(z.enum(['registrations', 'mappooling', 'referee', 'stats', 'pickems']))
//   .min(1);
// const rankRangeSchema = z.union([
//   z.literal('open rank'),
//   z.object({
//     lower: z.number().gte(1),
//     upper: z.number().gte(1)
//   })
// ]);
// const tournamentSchema = z.object({
//   name: z.string(),
//   acronym: z.string(),
//   type: z.union([z.literal('teams'), z.literal('solo'), z.literal('draft')]),
//   rankRange: rankRangeSchema,
//   useBWS: z.boolean(),
//   services: servicesSchema,
//   teamPlaySize: z.number().int().gte(1),
//   teamSize: z.number().int().gte(1)
// });

// async function createTournament(
//   tournament: z.infer<typeof tournamentSchema>,
//   user: {
//     id: number;
//     freeServicesLeft: number;
//   },
//   order?: PayPalOrder
// ) {
//   let { acronym, rankRange, name, useBWS, type, teamPlaySize, teamSize, services } = tournament;

//   return await tryCatch(async () => {
//     return await db.transaction(async (tx) => {
//       let tournament = findFirstOrThrow(
//         await tx
//           .insert(dbTournament)
//           .values({
//             name,
//             acronym,
//             useBWS,
//             services,
//             type,
//             lowerRankRange: rankRange === 'open rank' ? -1 : rankRange.lower,
//             upperRankRange: rankRange === 'open rank' ? -1 : rankRange.upper,
//             teamSize: type === 'teams' ? teamSize : 1,
//             teamPlaySize: type === 'teams' ? teamPlaySize : 1
//           })
//           .returning(pick(dbTournament, ['id'])),
//         'tournament'
//       );

//       if (order) {
//         await tx.insert(dbPurchase).values({
//           services,
//           cost: order.purchase_units[0].amount.value,
//           payPalOrderId: order.id,
//           purchasedById: user.id,
//           forTournamentId: tournament.id
//         });
//       }

//       let host = findFirstOrThrow(
//         await tx
//           .insert(dbStaffMember)
//           .values({
//             userId: user.id,
//             tournamentId: tournament.id
//           })
//           .returning(pick(dbStaffMember, ['id'])),
//         'staff member (host)'
//       );

//       let [_debuggerRole, hostRole] = await tx
//         .insert(dbStaffRole)
//         .values([
//           {
//             name: 'Debugger',
//             color: 'gray',
//             permissions: ['debug'],
//             order: 0,
//             tournamentId: tournament.id
//           },
//           {
//             name: 'Host',
//             color: 'red',
//             permissions: ['host'],
//             order: 1,
//             tournamentId: tournament.id
//           }
//         ])
//         .returning(pick(dbStaffRole, ['id']));

//       await tx.insert(dbStaffMemberToStaffRole).values({
//         staffMemberId: host.id,
//         staffRoleId: hostRole.id
//       });

//       if (user.freeServicesLeft > 0) {
//         await tx
//           .update(User)
//           .set({
//             freeServicesLeft:
//               services.length < 0 ? 0 : sql`${User.freeServicesLeft} - ${services.length}`
//           })
//           .where(eq(User.id, user.id));
//       }

//       return tournament;
//     });
//   }, "Can't create tournament");
// }

// export const tournamentRouter = t.router({
//   checkoutNewTournament: t.procedure
//     .use(getUser)
//     .input(
//       z.object({
//         services: servicesSchema,
//         type: z
//           .union([z.literal('teams'), z.literal('solo'), z.literal('draft')])
//           .optional()
//           .default('teams')
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       let key = input.type === 'teams' ? 'teamsPrice' : ('soloPrice' as 'teamsPrice' | 'soloPrice');
//       // From most to least expensive
//       input.services = input.services.sort((serviceA, serviceB) => {
//         return services[serviceA][key] < services[serviceB][key] ? 1 : -1;
//       });

//       let subtotal = input.services.reduce((total, service) => {
//         return total + services[service][key];
//       }, 0);

//       let freeServicesLeft = ctx.user.freeServicesLeft;
//       let discount = input.services.reduce((total, service) => {
//         if (freeServicesLeft > 0) {
//           freeServicesLeft--;
//           return total + services[service][key];
//         }

//         return total;
//       }, 0);
//       let total = subtotal - discount;

//       let request = new paypal.orders.OrdersCreateRequest();
//       request.prefer('return=representation');
//       request.requestBody({
//         intent: 'CAPTURE',
//         purchase_units: [
//           {
//             amount: {
//               ...money(total),
//               breakdown: {
//                 item_total: money(subtotal),
//                 discount: money(discount)
//               } as AmountBreakdown
//             },
//             items: input.services.map((service) => {
//               return {
//                 name: `Kyoso ${service} Service`,
//                 category: 'DIGITAL_GOODS',
//                 quantity: '1',
//                 unit_amount: money(services[service][key])
//               };
//             })
//           }
//         ]
//       });

//       let orderId = await tryCatch(async () => {
//         let order = await paypalClient.execute(request);
//         return order.result.id as string;
//       }, "Can't get PayPal order ID.");

//       return orderId;
//     }),
//   createTournament: t.procedure
//     .use(getUser)
//     .input(
//       z.object({
//         orderId: z.string(),
//         tournament: tournamentSchema
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       let request = new paypal.orders.OrdersGetRequest(input.orderId);

//       let order = await tryCatch(async () => {
//         let order = await paypalClient.execute(request);
//         return order.result as PayPalOrder;
//       }, `Can't get PayPal order with ID of ${input.orderId}.`);

//       return await createTournament(input.tournament, ctx.user, order);
//     }),
//   createFreeTournament: t.procedure
//     .use(getUser)
//     .input(tournamentSchema)
//     .mutation(async ({ ctx, input }) => {
//       if (ctx.user.freeServicesLeft === 0) {
//         throw new TRPCError({
//           code: 'FORBIDDEN',
//           message:
//             "You're not allowed to create tournaments for free. You  don't have any free services left."
//         });
//       }

//       return await createTournament(input, ctx.user);
//     }),
//   updateTournament: t.procedure
//     .use(getUserAsStaff)
//     .input(
//       z.object({
//         tournamentId: z.number().int(),
//         where: whereIdSchema,
//         data: z
//           .object({
//             name: z.string().max(50),
//             acronym: z.string().max(8),
//             rankRange: rankRangeSchema,
//             goPublicOn: z.date().nullish(),
//             concludesOn: z.date().nullish(),
//             playerRegsOpenOn: z.date().nullish(),
//             playerRegsCloseOn: z.date().nullish(),
//             staffRegsOpenOn: z.date().nullish(),
//             staffRegsCloseOn: z.date().nullish(),
//             useBWS: z.boolean(),
//             useTeamBanners: z.boolean(),
//             rules: z.string().nullish(),
//             forumPostId: z.number().int().nullish(),
//             discordInviteId: z.string().max(12).nullish(),
//             mainSheetId: z.string().max(45).nullish(),
//             twitchChannelName: z.string().max(25).nullish(),
//             youtubeChannelId: z.string().max(25).nullish(),
//             twitterHandle: z.string().max(15).nullish(),
//             donationLink: z.string().url().nullish(),
//             websiteLink: z.string().url().nullish(),
//             startTimerLength: z.number().int().gte(1),
//             pickTimerLength: z.number().int().gte(1),
//             doublePickAllowed: z.boolean(),
//             doubleBanAllowed: z.boolean(),
//             alwaysForceNoFail: z.boolean(),
//             rollRules: z.string().nullish(),
//             freeModRules: z.string().nullish(),
//             warmupRules: z.string().nullish(),
//             lateProcedures: z.string().nullish(),
//             banOrder: z.union([z.literal('ABABAB'), z.literal('ABBAAB')])
//           })
//           .deepPartial()
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin || hasPerms(ctx.staffMember, ['mutate_tournament', 'host']),
//         `update tournament with ID ${ctx.tournament.id}`
//       );

//       if (Object.keys(input.data).length === 0) return;

//       if (hasTournamentConcluded(ctx.tournament)) {
//         let keys = [
//           'acronym',
//           'banOrder',
//           'doubleBanAllowed',
//           'doublePickAllowed',
//           'freeModRules',
//           'lateProcedures',
//           'name',
//           'pickTimerLength',
//           'playerRegsCloseOn',
//           'playerRegsOpenOn',
//           'rankRange',
//           'rollRules',
//           'staffRegsCloseOn',
//           'staffRegsOpenOn',
//           'useBWS',
//           'warmupRules',
//           'alwaysForceNoFail',
//           'goPublicOn',
//           'startTimerLength',
//           'rules',
//           'useTeamBanners'
//         ] as const;

//         keys.forEach((key) => {
//           input.data[key] = undefined;
//         });
//       }

//       let {
//         where,
//         data: {
//           acronym,
//           banOrder,
//           discordInviteId,
//           donationLink,
//           doubleBanAllowed,
//           doublePickAllowed,
//           forumPostId,
//           freeModRules,
//           lateProcedures,
//           mainSheetId,
//           name,
//           pickTimerLength,
//           playerRegsCloseOn,
//           playerRegsOpenOn,
//           rankRange,
//           rollRules,
//           staffRegsCloseOn,
//           staffRegsOpenOn,
//           twitchChannelName,
//           useBWS,
//           warmupRules,
//           websiteLink,
//           youtubeChannelId,
//           alwaysForceNoFail,
//           concludesOn,
//           goPublicOn,
//           startTimerLength,
//           twitterHandle,
//           rules,
//           useTeamBanners
//         }
//       } = input;

//       await tryCatch(async () => {
//         await db
//           .update(dbTournament)
//           .set({
//             acronym,
//             banOrder,
//             discordInviteId,
//             donationLink,
//             doubleBanAllowed,
//             doublePickAllowed,
//             forumPostId,
//             freeModRules,
//             lateProcedures,
//             mainSheetId,
//             name,
//             pickTimerLength,
//             playerRegsCloseOn,
//             playerRegsOpenOn,
//             rollRules,
//             staffRegsCloseOn,
//             staffRegsOpenOn,
//             twitchChannelName,
//             useBWS,
//             warmupRules,
//             websiteLink,
//             youtubeChannelId,
//             alwaysForceNoFail,
//             concludesOn,
//             goPublicOn,
//             startTimerLength,
//             twitterHandle,
//             rules,
//             useTeamBanners,
//             lowerRankRange: rankRange === 'open rank' ? -1 : rankRange?.lower,
//             upperRankRange: rankRange === 'open rank' ? -1 : rankRange?.upper
//           })
//           .where(eq(dbTournament.id, where.id));
//       }, `Can't update tournament with ID ${ctx.tournament.id}.`);
//     }),
//   deleteTournament: t.procedure
//     .use(getUserAsStaff)
//     .input(whereIdSchema)
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin || hasPerms(ctx.staffMember, 'host'),
//         `delete tournament with ID ${ctx.tournament.id}`
//       );

//       await tryCatch(async () => {
//         await db.delete(dbTournament).where(eq(dbTournament.id, input.id));
//       }, `Can't delete tournament with ID ${ctx.tournament.id}.`);
//     })
// });

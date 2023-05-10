import prisma from '$prisma';
import paypal, { money } from '$paypal';
import { z } from 'zod';
import { orders } from '@paypal/checkout-server-sdk';
import { t, tryCatch } from '$trpc';
import { getUser, getUserAsStaff } from '$trpc/middleware';
import { services } from '$lib/constants';
import { TRPCError } from '@trpc/server';
import { isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { whereIdSchema } from '$lib/schemas';
import type { PayPalOrder } from '$types';
import type { AmountBreakdown } from '@paypal/checkout-server-sdk/lib/payments/lib';

const servicesSchema = z
  .array(z.enum(['Registrations', 'Mappooling', 'Referee', 'Stats', 'Pickems']))
  .min(1);
const rankRangeSchema = z.union([
  z.literal('open rank'),
  z.object({
    lower: z.number().gte(1),
    upper: z.number().gte(1)
  })
]);
const tournamentSchema = z.object({
  name: z.string(),
  acronym: z.string(),
  type: z.union([z.literal('Teams'), z.literal('Solo'), z.literal('Draft')]),
  rankRange: rankRangeSchema,
  useBWS: z.boolean(),
  services: servicesSchema,
  teamPlaySize: z.number().int().gte(1),
  teamSize: z.number().int().gte(1)
});

async function createTournament(
  tournament: z.infer<typeof tournamentSchema>,
  user: {
    id: number;
    freeServicesLeft: number;
  },
  order?: PayPalOrder
) {
  let { acronym, rankRange, name, useBWS, type, teamPlaySize, teamSize, services } = tournament;

  return await tryCatch(async () => {
    return await prisma.$transaction(async (tx) => {
      let tournament = await tx.tournament.create({
        data: {
          name,
          acronym,
          useBWS,
          services,
          type,
          lowerRankRange: rankRange === 'open rank' ? -1 : rankRange.lower,
          upperRankRange: rankRange === 'open rank' ? -1 : rankRange.upper,
          teamSize: type === 'Teams' ? teamSize : 1,
          teamPlaySize: type === 'Teams' ? teamPlaySize : 1,
          inPurchases: order
            ? {
                create: {
                  services,
                  cost: Number(order.purchase_units[0].amount.value),
                  paypalOrderId: order.id,
                  purchasedById: user.id
                }
              }
            : undefined
        },
        select: {
          id: true
        }
      });

      let staffMember = await tx.staffMember.create({
        data: {
          userId: user.id,
          tournamentId: tournament.id
        },
        select: {
          id: true
        }
      });

      await tx.staffRole.create({
        data: {
          name: 'Host',
          color: 'Red',
          permissions: ['Host'],
          tournamentId: tournament.id,
          staffMembers: {
            connect: {
              id: staffMember.id
            }
          }
        },
        select: {
          id: true
        }
      });

      if (user.freeServicesLeft > 0) {
        await tx.user.update({
          where: {
            id: user.id
          },
          data: {
            freeServicesLeft:
              services.length < 0
                ? 0
                : {
                    decrement: services.length
                  }
          },
          select: {
            id: true
          }
        });
      }

      return tournament;
    });
  }, "Can't create tournament");
}

export const tournamentRouter = t.router({
  checkoutNewTournament: t.procedure
    .use(getUser)
    .input(
      z.object({
        services: servicesSchema,
        type: z
          .union([z.literal('Teams'), z.literal('Solo')])
          .optional()
          .default('Teams')
      })
    )
    .mutation(async ({ ctx, input }) => {
      let key = input.type === 'Teams' ? 'teamsPrice' : ('soloPrice' as 'teamsPrice' | 'soloPrice');
      // From most to least expensive
      input.services = input.services.sort((serviceA, serviceB) => {
        return services[serviceA][key] < services[serviceB][key] ? 1 : -1;
      });

      let subtotal = input.services.reduce((total, service) => {
        return total + services[service][key];
      }, 0);

      let freeServicesLeft = ctx.user.freeServicesLeft;
      let discount = input.services.reduce((total, service) => {
        if (freeServicesLeft > 0) {
          freeServicesLeft--;
          return total + services[service][key];
        }

        return total;
      }, 0);
      let total = subtotal - discount;

      let request = new orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              ...money(total),
              breakdown: {
                item_total: money(subtotal),
                discount: money(discount)
              } as AmountBreakdown
            },
            items: input.services.map((service) => {
              return {
                name: `Kyoso ${service} Service`,
                category: 'DIGITAL_GOODS',
                quantity: '1',
                unit_amount: money(services[service][key])
              };
            })
          }
        ]
      });

      let orderId = await tryCatch(async () => {
        let order = await paypal.execute(request);
        return order.result.id as string;
      }, "Can't get PayPal order ID.");

      return orderId;
    }),
  createTournament: t.procedure
    .use(getUser)
    .input(
      z.object({
        orderId: z.string(),
        tournament: tournamentSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      let request = new orders.OrdersGetRequest(input.orderId);

      let order = await tryCatch(async () => {
        let order = await paypal.execute(request);
        return order.result as PayPalOrder;
      }, `Can't get PayPal order with ID of ${input.orderId}.`);

      return await createTournament(input.tournament, ctx.user, order);
    }),
  createFreeTournament: t.procedure
    .use(getUser)
    .input(tournamentSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.freeServicesLeft === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            "You're not allowed to create tournaments for free. You  don't have any free services left."
        });
      }

      return await createTournament(input, ctx.user);
    }),
  updateTournament: t.procedure
    .use(getUserAsStaff)
    .input(
      z.object({
        tournamentId: z.number().int(),
        where: whereIdSchema,
        data: z
          .object({
            name: z.string().max(50),
            acronym: z.string().max(8),
            rankRange: rankRangeSchema,
            goPublicOn: z.date().nullish(),
            concludesOn: z.date().nullish(),
            playerRegsOpenOn: z.date().nullish(),
            playerRegsCloseOn: z.date().nullish(),
            staffRegsOpenOn: z.date().nullish(),
            staffRegsCloseOn: z.date().nullish(),
            useBWS: z.boolean(),
            hasBanner: z.boolean(),
            rules: z.string().nullish(),
            forumPostId: z.number().int().nullish(),
            discordInviteId: z.string().max(12).nullish(),
            mainSheetId: z.string().max(45).nullish(),
            twitchChannelName: z.string().max(25).nullish(),
            youtubeChannelId: z.string().max(25).nullish(),
            twitterHandle: z.string().max(15).nullish(),
            donationLink: z.string().url().nullish(),
            websiteLink: z.string().url().nullish(),
            startTimerLength: z.number().int().gte(1),
            pickTimerLength: z.number().int().gte(1),
            doublePickAllowed: z.boolean(),
            doubleBanAllowed: z.boolean(),
            alwaysForceNoFail: z.boolean(),
            rollRules: z.string().nullish(),
            freeModRules: z.string().nullish(),
            warmupRules: z.string().nullish(),
            lateProcedures: z.string().nullish(),
            banOrder: z.union([z.literal('ABABAB'), z.literal('ABBAAB')]),
            teamSize: z.number().int(),
            teamPlaySize: z.number().int()
          })
          .deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `update tournament with ID ${ctx.tournament.id}`
      );

      if (Object.keys(input.data).length === 0) return;
      let {
        where,
        data: {
          acronym,
          banOrder,
          discordInviteId,
          donationLink,
          doubleBanAllowed,
          doublePickAllowed,
          forumPostId,
          freeModRules,
          lateProcedures,
          mainSheetId,
          name,
          pickTimerLength,
          playerRegsCloseOn,
          playerRegsOpenOn,
          rankRange,
          rollRules,
          staffRegsCloseOn,
          staffRegsOpenOn,
          teamPlaySize,
          teamSize,
          twitchChannelName,
          useBWS,
          warmupRules,
          websiteLink,
          youtubeChannelId,
          alwaysForceNoFail,
          concludesOn,
          goPublicOn,
          hasBanner,
          startTimerLength,
          twitterHandle,
          rules
        }
      } = input;

      await tryCatch(async () => {
        await prisma.tournament.update({
          where,
          data: {
            acronym,
            banOrder,
            discordInviteId,
            donationLink,
            doubleBanAllowed,
            doublePickAllowed,
            forumPostId,
            freeModRules,
            lateProcedures,
            mainSheetId,
            name,
            pickTimerLength,
            playerRegsCloseOn,
            playerRegsOpenOn,
            rollRules,
            staffRegsCloseOn,
            staffRegsOpenOn,
            twitchChannelName,
            useBWS,
            warmupRules,
            websiteLink,
            youtubeChannelId,
            teamPlaySize,
            teamSize,
            alwaysForceNoFail,
            concludesOn,
            goPublicOn,
            hasBanner,
            startTimerLength,
            twitterHandle,
            rules,
            lowerRankRange: rankRange === 'open rank' ? -1 : rankRange?.lower,
            upperRankRange: rankRange === 'open rank' ? -1 : rankRange?.upper
          }
        });
      }, `Can't update tournament with ID ${ctx.tournament.id}.`);
    }),
  deleteTournament: t.procedure
    .use(getUserAsStaff)
    .input(whereIdSchema)
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, 'Host'),
        `delete tournament with ID ${ctx.tournament.id}`
      );

      await tryCatch(async () => {
        await prisma.tournament.delete({
          where: {
            id: input.id
          }
        });
      }, `Can't delete tournament with ID ${ctx.tournament.id}.`);
    })
});

import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

const prizeMutationSchema = z.object({
  type: z.union([z.literal('Tournament'), z.literal('Pickems')]),
  placements: z.array(z.number().int()),
  trophy: z.boolean().default(false),
  medal: z.boolean().default(false),
  badge: z.boolean().default(false),
  banner: z.boolean().default(false),
  cash: z
    .object({
      value: z.number(),
      metric: z.union([z.literal('Fixed'), z.literal('Percent')]).default('Fixed'),
      currency: z.string().length(3)
    })
    .optional(),
  items: z.array(z.string().max(25)).default([]),
  osuSupporter: z.number().int().default(0)
});

export const prizesRouter = t.router({
  createPrize: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: prizeMutationSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug']),
        `create prize for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { type, placements, trophy, medal, badge, banner, cash, items, osuSupporter }
      } = input;

      await tryCatch(async () => {
        await prisma.prize.create({
          data: {
            type,
            placements,
            trophy,
            medal,
            badge,
            banner,
            items,
            osuSupporter,
            tournamentId,
            cash: cash
              ? {
                  create: {
                    currency: cash.currency,
                    metric: cash.metric,
                    value: cash.value
                  }
                }
              : undefined
          }
        });
      }, "Can't create prize.");
    }),
  updatePrize: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        data: prizeMutationSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug']),
        `update prize of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        where,
        data: { type, placements, trophy, medal, badge, banner, cash, items, osuSupporter }
      } = input;

      if (Object.keys(input.data).length === 0) return;

      await tryCatch(async () => {
        await prisma.prize.update({
          where,
          data: {
            type,
            placements,
            trophy,
            medal,
            badge,
            banner,
            items,
            osuSupporter,
            tournamentId,
            cash: {
              update: {
                currency: cash?.currency,
                metric: cash?.metric,
                value: cash?.value
              }
            }
          }
        });
      }, `Can't update prize of ID ${where.id}.`);
    }),
  deletePrize: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug']),
        `delete prize of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.prize.delete({
          where
        });
      }, `Can't delete prize of ID ${where.id}.`);
    })
});

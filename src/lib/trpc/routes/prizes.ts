import db from '$db';
import { dbPrize, dbPrizeCash } from '$db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { findFirstOrThrow, forbidIf, isAllowed, select } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

const prizeMutationSchema = z.object({
  type: z.union([z.literal('tournament'), z.literal('pickems')]),
  placements: z.array(z.number().int()),
  trophy: z.boolean().default(false),
  medal: z.boolean().default(false),
  badge: z.boolean().default(false),
  banner: z.boolean().default(false),
  cash: z
    .object({
      value: z.number(),
      metric: z.union([z.literal('fixed'), z.literal('percent')]).default('fixed'),
      currency: z.string().length(3)
    })
    .optional(),
  additionalItems: z.array(z.string().max(25)).default([]),
  monthsOsuSupporter: z.number().int().nullish().default(0)
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
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `create prize for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { type, placements, trophy, medal, badge, banner, cash, additionalItems, monthsOsuSupporter }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          let prize = findFirstOrThrow(
            await tx
              .insert(dbPrize)
              .values({
                type,
                placements,
                trophy,
                medal,
                badge,
                banner,
                additionalItems,
                monthsOsuSupporter,
                tournamentId
              })
              .returning(select(dbPrize, [
                'id'
              ])),
            'prize'
          );

          if (cash) {
            await tx
              .insert(dbPrizeCash)
              .values({
                ...cash,
                inPrizeId: prize.id
              });
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
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `update prize of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        where,
        data: { type, placements, trophy, medal, badge, banner, cash, additionalItems, monthsOsuSupporter }
      } = input;

      if (Object.keys(input.data).length === 0) return;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          await tx
            .update(dbPrize)
            .set({
              type,
              placements,
              trophy,
              medal,
              badge,
              banner,
              additionalItems,
              monthsOsuSupporter,
              tournamentId
            })
            .where(eq(dbPrize.id, where.id));
          
          if (cash) {
            await tx
              .update(dbPrizeCash)
              .set(cash)
              .where(eq(dbPrizeCash.inPrizeId, where.id));
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
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `delete prize of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await db
          .delete(dbPrize)
          .where(eq(dbPrize.id, where.id));
      }, `Can't delete prize of ID ${where.id}.`);
    })
});

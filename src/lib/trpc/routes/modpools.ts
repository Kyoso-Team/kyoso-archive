import db from '$db';
import { dbModpool } from '$db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaffWithRound } from '$trpc/middleware';
import { whereIdSchema, withRoundSchema, modSchema } from '$lib/schemas';
import { forbidIf, getRowCount, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { swapOrder } from '$trpc/helpers';

const modpoolsMutationSchema = z.object({
  category: z.string().max(3),
  isFreeMod: z.boolean(),
  isTieBreaker: z.boolean(),
  mapCount: z.number()
});

export const modpoolsRouter = t.router({
  createModpool: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        data: modpoolsMutationSchema.extend({
          mods: z.array(modSchema)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pool_structure']),
        `create modpool for tournament of ID ${input.tournamentId}`
      );

      forbidIf.doesntIncludeService(ctx.tournament, 'mappooling');
      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        roundId,
        data: { category, isFreeMod, isTieBreaker, mapCount, mods }
      } = input;

      await tryCatch(async () => {
        let modpoolCount = await getRowCount(dbModpool, eq(dbModpool.roundId, roundId));

        await db.insert(dbModpool).values({
          category,
          isFreeMod,
          isTieBreaker,
          mapCount,
          mods,
          roundId,
          order: modpoolCount + 1
        });
      }, "Can't create modpool.");
    }),
  updateModpool: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        where: whereIdSchema,
        data: modpoolsMutationSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pool_structure']),
        `update modpool of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { category, isFreeMod, isTieBreaker, mapCount }
      } = input;

      await tryCatch(async () => {
        await db
          .update(dbModpool)
          .set({
            category,
            isFreeMod,
            isTieBreaker,
            mapCount
          })
          .where(eq(dbModpool.id, where.id));
      }, `Can't update modpool of ID ${where.id}.`);
    }),
  swapOrder: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        modpool1: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        }),
        modpool2: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pool_structure']),
        `change the order of modpools for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await swapOrder(db, dbModpool, input.modpool1, input.modpool2);
      }, `Can't change the order of modpools for tournament of ID ${input.tournamentId}.`);
    }),
  deleteModpool: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        where: whereIdSchema.extend({
          order: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pool_structure']),
        `delete modpool of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        roundId,
        where: { id, order }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          await tx.delete(dbModpool).where(eq(dbModpool.id, id));

          await tx
            .update(dbModpool)
            .set({
              order: sql`${dbModpool.order} - 1`
            })
            .where(and(eq(dbModpool.roundId, roundId), gt(dbModpool.order, order)));
        });
      }, `Can't delete modpool of ID ${id}.`);
    })
});

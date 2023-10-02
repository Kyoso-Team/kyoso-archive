import db from '$db';
import { dbStage } from '$db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { findFirstOrThrow, forbidIf, getRowCount, isAllowed, select } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { swapOrder } from '$trpc/helpers';

export const stagesRouter = t.router({
  createStage: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: z.object({
          format: z.union([
            z.literal('groups'),
            z.literal('swiss'),
            z.literal('double_elim'),
            z.literal('single_elim'),
            z.literal('battle_royale'),
            z.literal('qualifiers')
          ])
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `create stage for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { format }
      } = input;

      await tryCatch(async () => {
        let stageCount = await getRowCount(dbStage, eq(dbStage.tournamentId, tournamentId));

        await db.insert(dbStage).values({
          format,
          tournamentId,
          order: stageCount + 1
        });
      }, "Can't create stage.");
    }),
  makeMain: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        stageId: z.number().int()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `set stage with ID ${input.stageId} as the main stage`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          let currentMainStage = findFirstOrThrow(
            await db
              .select(select(dbStage, ['id']))
              .from(dbStage)
              .where(
                and(eq(dbStage.tournamentId, input.tournamentId), eq(dbStage.isMainStage, true))
              ),
            'stage'
          );

          if (currentMainStage.id === input.stageId) return;

          await tx
            .update(dbStage)
            .set({
              isMainStage: false
            })
            .where(eq(dbStage.id, currentMainStage.id));

          await tx
            .update(dbStage)
            .set({
              isMainStage: true
            })
            .where(eq(dbStage.id, input.stageId));
        });
      }, `Can't set stage with ID ${input.stageId} as the main stage.`);
    }),
  swapOrder: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        stage1: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        }),
        stage2: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `change the order of stages for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await swapOrder(db, dbStage, input.stage1, input.stage2);
      }, `Can't change the order of stages for tournament of ID ${input.tournamentId}.`);
    }),
  deleteStage: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema.extend({
          order: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `delete stage of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        where: { id, order }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          await tx.delete(dbStage).where(eq(dbStage.id, id));

          await tx
            .update(dbStage)
            .set({
              order: sql`${dbStage.order} - 1`
            })
            .where(and(eq(dbStage.tournamentId, tournamentId), gt(dbStage.order, order)));
        });
      }, `Can't delete stage of ID ${id}.`);
    })
});

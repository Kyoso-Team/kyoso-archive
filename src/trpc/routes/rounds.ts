import db from '$db';
import { dbRound, dbStandardRound, dbQualifierRound, dbBattleRoyaleRound } from '$db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, getRowCount, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { swapOrder } from '$trpc/helpers';
import type { InferInsertModel } from 'drizzle-orm';

const baseSchema = z.object({
  name: z.string().max(20)
});

const extendCreate = {
  stageId: z.number().int()
};

const standardSchema = baseSchema.extend({
  bestOf: z
    .number()
    .int()
    .gte(1)
    .refine((n: number) => n % 2 !== 0, 'Input must be odd'),
  banCount: z.number().int().gte(0),
  protectCount: z.number().int().gte(0)
});

const qualifierSchema = baseSchema.extend({
  runCount: z.number().int().gte(1),
  summarizeRunsAs: z.union([z.literal('sum'), z.literal('average'), z.literal('best')]).optional()
});

const battleRoyaleRound = baseSchema.extend({
  playersEliminatedPerMap: z.number().int().gte(1)
});

async function createRound({
  stageId,
  tournamentId,
  name,
  standardRound,
  qualifierRound,
  battleRoyaleRound
}: Omit<InferInsertModel<typeof dbRound>, 'order'> &
  Partial<{
    standardRound: Omit<InferInsertModel<typeof dbStandardRound>, 'roundId'>;
    qualifierRound: Omit<InferInsertModel<typeof dbQualifierRound>, 'roundId'>;
    battleRoyaleRound: Omit<InferInsertModel<typeof dbBattleRoyaleRound>, 'roundId'>;
  }>) {
  await tryCatch(async () => {
    await db.transaction(async (tx) => {
      let roundCount = await getRowCount(dbRound, eq(dbRound.stageId, stageId));

      let [{ roundId }] = await tx
        .insert(dbRound)
        .values({
          name,
          stageId,
          tournamentId,
          order: roundCount + 1
        })
        .returning({
          roundId: dbRound.id
        });

      if (standardRound) {
        await tx.insert(dbStandardRound).values({
          ...standardRound,
          roundId
        });
      } else if (qualifierRound) {
        await tx.insert(dbQualifierRound).values({
          ...qualifierRound,
          roundId
        });
      } else if (battleRoyaleRound) {
        await tx.insert(dbBattleRoyaleRound).values({
          ...battleRoyaleRound,
          roundId
        });
      }
    });
  }, "Can't create round.");
}

async function updateRound(
  roundId: number,
  {
    name,
    standardRound,
    qualifierRound,
    battleRoyaleRound
  }: Partial<{
    name: string;
    standardRound: Partial<InferInsertModel<typeof dbStandardRound>>;
    qualifierRound: Partial<InferInsertModel<typeof dbQualifierRound>>;
    battleRoyaleRound: Partial<InferInsertModel<typeof dbBattleRoyaleRound>>;
  }>
) {
  await tryCatch(async () => {
    if (name) {
      await db.update(dbRound).set({ name }).where(eq(dbRound.id, roundId));
    }

    if (standardRound) {
      await db.update(dbStandardRound).set(standardRound);
    } else if (qualifierRound) {
      await db.update(dbQualifierRound).set(qualifierRound);
    } else if (battleRoyaleRound) {
      await db.update(dbBattleRoyaleRound).set(battleRoyaleRound);
    }
  }, `Can't update round of ID ${roundId}.`);
}

export const roundsRouter = t.router({
  createStandardRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: standardSchema.extend(extendCreate)
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `create round for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, stageId, bestOf, banCount, protectCount }
      } = input;

      await createRound({
        name,
        tournamentId,
        stageId,
        standardRound: {
          bestOf,
          banCount,
          protectCount
        }
      });
    }),
  createQualifierRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: qualifierSchema.extend(extendCreate)
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `create round for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, stageId, runCount, summarizeRunsAs }
      } = input;

      await createRound({
        name,
        tournamentId,
        stageId,
        qualifierRound: {
          runCount,
          summarizeRunsAs
        }
      });
    }),
  createBattleRoyaleRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: battleRoyaleRound.extend(extendCreate)
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `create round for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, stageId, playersEliminatedPerMap }
      } = input;

      await createRound({
        name,
        tournamentId,
        stageId,
        battleRoyaleRound: {
          playersEliminatedPerMap
        }
      });
    }),
  updateStandardRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        tournamentId: z.number().int(),
        where: whereIdSchema,
        data: standardSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `update round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        data: { name, bestOf, banCount, protectCount }
      } = input;

      await updateRound(input.where.id, {
        name,
        standardRound: {
          banCount,
          bestOf,
          protectCount
        }
      });
    }),
  updateQualifierRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        data: qualifierSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `update round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        data: { name, runCount, summarizeRunsAs }
      } = input;

      await updateRound(input.where.id, {
        name,
        qualifierRound: {
          runCount,
          summarizeRunsAs
        }
      });
    }),
  updateBattleRoyaleRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema,
        data: battleRoyaleRound.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `update round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        data: { name, playersEliminatedPerMap }
      } = input;

      await updateRound(input.where.id, {
        name,
        battleRoyaleRound: {
          playersEliminatedPerMap
        }
      });
    }),
  swapOrder: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        round1: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        }),
        round2: z.object({
          id: z.number().int(),
          order: z.number().int().gte(1)
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `change the order of rounds for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await swapOrder(db, dbRound, input.round1, input.round2);
      }, `Can't change the order of rounds for tournament of ID ${input.tournamentId}.`);
    }),
  deleteRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema.extend({
          stageId: z.number().int(),
          order: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
        `delete round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        where: { id, order, stageId }
      } = input;

      await tryCatch(async () => {
        await db.transaction(async (tx) => {
          await tx.delete(dbRound).where(eq(dbRound.id, id));

          await tx
            .update(dbRound)
            .set({
              order: sql`${dbRound.order} - 1`
            })
            .where(and(eq(dbRound.stageId, stageId), gt(dbRound.order, order)));
        });
      }, `Can't delete round of ID ${id}.`);
    })
});

import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import type { Prisma } from '@prisma/client';

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
  banCount: z.number().int().gte(0)
});

const qualifierSchema = baseSchema.extend({
  runCount: z.number().int().gte(1),
  summarizeRunsAs: z.union([z.literal('Sum'), z.literal('Average'), z.literal('Best')]).optional()
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
}: Omit<Prisma.RoundCreateArgs['data'], 'order'>) {
  await tryCatch(async () => {
    let roundCount = await prisma.round.count({
      where: {
        stageId
      }
    });

    await prisma.round.create({
      data: {
        name,
        standardRound,
        qualifierRound,
        battleRoyaleRound,
        order: roundCount + 1,
        stage: {
          connect: {
            id: stageId
          }
        },
        tournament: {
          connect: {
            id: tournamentId
          }
        }
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
  }: Omit<Prisma.RoundUpdateArgs['data'], 'order'>
) {
  await tryCatch(async () => {
    await prisma.round.update({
      where: {
        id: roundId
      },
      data: {
        name,
        standardRound,
        qualifierRound,
        battleRoyaleRound
      }
    });
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `create round for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let {
        tournamentId,
        data: { name, stageId, bestOf, banCount }
      } = input;

      await createRound({
        name,
        tournamentId,
        stageId,
        standardRound: {
          create: {
            bestOf,
            banCount
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
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
          create: {
            runCount,
            summarizeRunsAs
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
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
          create: {
            playersEliminatedPerMap
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `update round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        data: { name, bestOf, banCount }
      } = input;

      await updateRound(input.where.id, {
        name,
        standardRound: {
          update: {
            banCount,
            bestOf
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
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
          update: {
            runCount,
            summarizeRunsAs
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
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
          update: {
            playersEliminatedPerMap
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `change the order of rounds for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await prisma.$transaction([
          prisma.round.update({
            where: {
              id: input.round1.id
            },
            data: {
              order: input.round2.order
            }
          }),
          prisma.round.update({
            where: {
              id: input.round2.id
            },
            data: {
              order: input.round1.order
            }
          })
        ]);
      }, `Can't change the order of rounds for tournament of ID ${input.tournamentId}.`);
    }),
  deleteRound: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        tournamentId: z.number().int(),
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `delete round of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.round.delete({
          where
        });
      }, `Can't delete round of ID ${where.id}.`);
    })
});

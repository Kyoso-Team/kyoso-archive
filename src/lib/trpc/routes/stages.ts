import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUser, getUserAsStaff } from '$trpc/middleware';
import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

export const stagesRouter = t.router({
  createStage: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        data: z.object({
          format: z.union([
            z.literal('Groups'),
            z.literal('Swiss'),
            z.literal('DoubleElim'),
            z.literal('SingleElim'),
            z.literal('BattleRoyale'),
            z.literal('Qualifiers')
          ])
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `create stage for tournament of ID ${input.tournamentId}`
      );

      let { tournamentId, data: { format } } = input;

      await tryCatch(
        async () => {
          let stageCount = await prisma.stage.count({
            where: {
              tournamentId
            }
          });

          await prisma.stage.create({
            data: {
              format,
              tournamentId,
              order: stageCount + 1
            }
          });
        },
        'Can\'t create stage.'
      );
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
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `set stage with ID ${input.stageId} as the main stage`
      );

      await tryCatch(
        async () => {
          await prisma.$transaction(async (tx) => {
            let currentMainStage = await tx.stage.findFirstOrThrow({
              where: {
                tournamentId: input.tournamentId,
                isMainStage: true
              },
              select: {
                id: true
              }
            });

            if (currentMainStage.id === input.stageId) return;

            await tx.stage.update({
              where: {
                id: currentMainStage.id
              },
              data: {
                isMainStage: false
              }
            });

            await tx.stage.update({
              where: {
                id: input.stageId
              },
              data: {
                isMainStage: true
              }
            });
          });
        },
        `Can't set stage with ID ${input.stageId} as the main stage.`
      );
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
    ).mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `change the order of stages for tournament of ID ${input.tournamentId}`
      );

      await tryCatch(
        async () => {
          await prisma.$transaction([
            prisma.stage.update({
              where: {
                id: input.stage1.id
              },
              data: {
                order: input.stage2.order
              }
            }),
            prisma.stage.update({
              where: {
                id: input.stage2.id
              },
              data: {
                order: input.stage1.order
              }
            })
          ]);
        },
        `Can't change the order of stages for tournament of ID ${input.tournamentId}.`
      );
    }),
  deleteStage: t.procedure
    .use(getUserAsStaff)
    .input(
      withTournamentSchema.extend({
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host']),
        `delete stage of ID ${input.where.id}`
      );

      let { where } = input;

      await tryCatch(
        async () => {
          await prisma.stage.delete({
            where
          });
        },
        `Can't delete stage of ID ${where.id}.`
      );
    })
});

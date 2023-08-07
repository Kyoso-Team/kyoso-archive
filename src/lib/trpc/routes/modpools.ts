import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaffWithRound } from '$trpc/middleware';
import { whereIdSchema, withRoundSchema, modSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';

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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolStructure']),
        `create modpool for tournament of ID ${input.tournamentId}`
      );

      forbidIf.doesntIncludeService(ctx.tournament, 'Mappooling');
      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        roundId,
        data: { category, isFreeMod, isTieBreaker, mapCount, mods }
      } = input;

      await tryCatch(async () => {
        let modpoolCount = await prisma.modpool.count({
          where: {
            roundId
          }
        });

        await prisma.modpool.create({
          data: {
            category,
            isFreeMod,
            isTieBreaker,
            mapCount,
            mods,
            roundId,
            order: modpoolCount + 1
          }
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolStructure']),
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
        await prisma.modpool.update({
          where,
          data: {
            category,
            isFreeMod,
            isTieBreaker,
            mapCount
          }
        });
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolStructure']),
        `change the order of modpools for tournament of ID ${input.tournamentId}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      await tryCatch(async () => {
        await prisma.$transaction([
          prisma.modpool.update({
            where: {
              id: input.modpool1.id
            },
            data: {
              order: input.modpool2.order
            }
          }),
          prisma.modpool.update({
            where: {
              id: input.modpool2.id
            },
            data: {
              order: input.modpool1.order
            }
          })
        ]);
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
        hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolStructure']),
        `delete modpool of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        roundId,
        where: { id, order }
      } = input;

      await tryCatch(async () => {
        await prisma.$transaction([
          prisma.modpool.delete({
            where: {
              id
            }
          }),
          prisma.modpool.updateMany({
            where: {
              roundId,
              order: {
                gt: order
              }
            },
            data: {
              order: {
                decrement: 1
              }
            }
          })
        ]);
      }, `Can't delete modpool of ID ${id}.`);
    })
});

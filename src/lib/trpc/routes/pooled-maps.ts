import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaffWithRound } from '$trpc/middleware';
import { whereIdSchema, withRoundSchema, skillsetSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { getOrCreateMap } from '$trpc/helpers';

const pooledMapsMutationSchema = z.object({
  skillset: skillsetSchema,
  comment: z.string().nullish().optional()
});

export const pooledMapsRouter = t.router({
  createMap: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        data: pooledMapsMutationSchema.extend({
          slot: z.number().int().gte(1),
          modpoolId: z.number().int(),
          osuBeatmapId: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin ||
          hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePooledMaps']),
        `create pooled beatmap for tournament of ID ${input.tournamentId}`
      );

      forbidIf.doesntIncludeService(ctx.tournament, 'Mappooling');
      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        tournamentId,
        roundId,
        data: { modpoolId, osuBeatmapId, skillset, comment, slot }
      } = input;

      let suggestedMap = await prisma.suggestedMap.findUnique({
        where: {
          beatmapId_modpoolId: {
            beatmapId: osuBeatmapId,
            modpoolId
          }
        },
        select: {
          beatmapId: true,
          suggestedById: true
        }
      });

      if (suggestedMap) {
        await tryCatch(async () => {
          if (!suggestedMap) return;

          await prisma.pooledMap.create({
            data: {
              slot,
              skillset,
              comment,
              tournamentId,
              roundId,
              modpoolId,
              beatmapId: suggestedMap.beatmapId,
              suggestedById: suggestedMap.suggestedById,
              pooledById: ctx.staffMember.id
            }
          });
        }, "Can't create pooled beatmap.");

        return;
      }

      let map = await getOrCreateMap(prisma, ctx.user.osuAccessToken, osuBeatmapId, modpoolId);

      await tryCatch(async () => {
        await prisma.pooledMap.create({
          data: {
            slot,
            skillset,
            comment,
            tournamentId,
            roundId,
            modpoolId,
            beatmapId: map.osuBeatmapId,
            suggestedById: ctx.staffMember.id,
            pooledById: ctx.staffMember.id
          }
        });
      }, "Can't create pooled beatmap.");
    }),
  updateMap: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        where: whereIdSchema,
        data: pooledMapsMutationSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin ||
          hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePooledMaps']),
        `update pooled beatmap of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { skillset, comment }
      } = input;

      await tryCatch(async () => {
        await prisma.pooledMap.update({
          where,
          data: {
            skillset,
            comment
          }
        });
      }, `Can't update pooled beatmap of ID ${where.id}.`);
    }),
  deleteMap: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        where: whereIdSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin ||
          hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'DeletePooledMaps']),
        `delete pooled beatmap of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.pooledMap.delete({
          where
        });
      }, `Can't delete pooled beatmap of ID ${where.id}.`);
    })
});

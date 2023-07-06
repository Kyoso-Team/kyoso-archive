import prisma from '$prisma';
import { z } from 'zod';
import { t, tryCatch } from '$trpc';
import { getUserAsStaffWithRound } from '$trpc/middleware';
import { whereIdSchema, withRoundSchema, skillsetSchema } from '$lib/schemas';
import { forbidIf, isAllowed } from '$lib/server-utils';
import { hasPerms } from '$lib/utils';
import { getOrCreateMap } from '$trpc/helpers';

const suggestedMapsMutationSchema = z.object({
  suggestedSkillset: skillsetSchema,
  comment: z.string().nullish().optional()
});

export const suggestedMapsRouter = t.router({
  createMap: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        data: suggestedMapsMutationSchema.extend({
          modpoolId: z.number().int(),
          osuBeatmapId: z.number().int()
        })
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolSuggestions']),
        `create beatmap suggestion for tournament of ID ${input.tournamentId}`
      );

      forbidIf.doesntIncludeService(ctx.tournament, 'Mappooling');
      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let {
        tournamentId,
        roundId,
        data: { modpoolId, osuBeatmapId, suggestedSkillset, comment }
      } = input;

      let beatmap = await getOrCreateMap(prisma, ctx.user.osuAccessToken, osuBeatmapId, modpoolId);

      await tryCatch(async () => {
        await prisma.suggestedMap.create({
          data: {
            suggestedSkillset,
            comment,
            tournamentId,
            roundId,
            modpoolId,
            beatmapId: beatmap.osuBeatmapId,
            suggestedById: ctx.staffMember.id
          }
        });
      }, "Can't create beatmap suggestion.");
    }),
  updateMap: t.procedure
    .use(getUserAsStaffWithRound)
    .input(
      withRoundSchema.extend({
        where: whereIdSchema,
        data: suggestedMapsMutationSchema.deepPartial()
      })
    )
    .mutation(async ({ ctx, input }) => {
      isAllowed(
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'MutatePoolSuggestions']),
        `update suggested beatmap of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);

      if (Object.keys(input.data).length === 0) return;

      let {
        where,
        data: { suggestedSkillset, comment }
      } = input;

      await tryCatch(async () => {
        await prisma.suggestedMap.update({
          where,
          data: {
            suggestedSkillset,
            comment
          }
        });
      }, `Can't update suggested beatmap of ID ${where.id}.`);
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
        ctx.user.isAdmin || hasPerms(ctx.staffMember, ['MutateTournament', 'Host', 'Debug', 'DeletePoolSuggestions']),
        `delete suggested beatmap of ID ${input.where.id}`
      );

      forbidIf.hasConcluded(ctx.tournament);
      forbidIf.poolIsPublished(ctx.round);

      let { where } = input;

      await tryCatch(async () => {
        await prisma.suggestedMap.delete({
          where
        });
      }, `Can't delete suggested beatmap of ID ${where.id}.`);
    })
});

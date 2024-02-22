// import db from '$db';
// import { dbSuggestedMap } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import { z } from 'zod';
// import { t, tryCatch } from '$trpc';
// import { getUserAsStaffWithRound } from '$trpc/middleware';
// import { whereIdSchema, withRoundSchema, skillsetSchema } from '$lib/schemas';
// import { forbidIf, isAllowed } from '$lib/server-utils';
// import { hasPerms } from '$lib/utils';
// import { getOrCreateMap } from '$trpc/helpers';

// const suggestedMapsMutationSchema = z.object({
//   suggestedSkillsets: z.array(skillsetSchema),
//   comment: z.string().nullish().optional()
// });

// export const suggestedMapsRouter = t.router({
//   createMap: t.procedure
//     .use(getUserAsStaffWithRound)
//     .input(
//       withRoundSchema.extend({
//         data: suggestedMapsMutationSchema.extend({
//           modpoolId: z.number().int(),
//           osuBeatmapId: z.number().int()
//         })
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin ||
//           hasPerms(ctx.staffMember, [
//             'mutate_tournament',
//             'host',
//             'debug',
//             'mutate_pool_suggestions'
//           ]),
//         `create beatmap suggestion for tournament of ID ${input.tournamentId}`
//       );

//       forbidIf.doesntIncludeService(ctx.tournament, 'mappooling');
//       forbidIf.hasConcluded(ctx.tournament);
//       forbidIf.poolIsPublished(ctx.round);

//       let {
//         tournamentId,
//         roundId,
//         data: { modpoolId, osuBeatmapId, suggestedSkillsets, comment }
//       } = input;

//       let beatmap = await getOrCreateMap(db, ctx.user.osuAccessToken, osuBeatmapId, modpoolId);

//       await tryCatch(async () => {
//         await db.insert(dbSuggestedMap).values({
//           suggestedSkillsets,
//           tournamentId,
//           roundId,
//           modpoolId,
//           suggesterComment: comment,
//           beatmapId: beatmap.osuBeatmapId,
//           suggestedByStaffMemberId: ctx.staffMember.id
//         });
//       }, "Can't create beatmap suggestion.");
//     }),
//   updateMap: t.procedure
//     .use(getUserAsStaffWithRound)
//     .input(
//       withRoundSchema.extend({
//         where: whereIdSchema,
//         data: suggestedMapsMutationSchema.deepPartial()
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin ||
//           hasPerms(ctx.staffMember, [
//             'mutate_tournament',
//             'host',
//             'debug',
//             'mutate_pool_suggestions'
//           ]),
//         `update suggested beatmap of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);

//       if (Object.keys(input.data).length === 0) return;

//       let {
//         where,
//         data: { suggestedSkillsets, comment }
//       } = input;

//       await tryCatch(async () => {
//         await db
//           .update(dbSuggestedMap)
//           .set({
//             suggestedSkillsets,
//             suggesterComment: comment
//           })
//           .where(eq(dbSuggestedMap.id, where.id));
//       }, `Can't update suggested beatmap of ID ${where.id}.`);
//     }),
//   deleteMap: t.procedure
//     .use(getUserAsStaffWithRound)
//     .input(
//       withRoundSchema.extend({
//         where: whereIdSchema
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin ||
//           hasPerms(ctx.staffMember, [
//             'mutate_tournament',
//             'host',
//             'debug',
//             'mutate_pool_suggestions'
//           ]),
//         `delete suggested beatmap of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);
//       forbidIf.poolIsPublished(ctx.round);

//       let { where } = input;

//       await tryCatch(async () => {
//         await db.delete(dbSuggestedMap).where(eq(dbSuggestedMap.id, where.id));
//       }, `Can't delete suggested beatmap of ID ${where.id}.`);
//     })
// });

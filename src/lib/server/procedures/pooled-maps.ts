// import db from '$db';
// import { dbPooledMap, dbSuggestedMap } from '$db/schema';
// import { eq, and } from 'drizzle-orm';
// import { z } from 'zod';
// import { t, tryCatch } from '$trpc';
// import { getUserAsStaffWithRound } from '$trpc/middleware';
// import { whereIdSchema, withRoundSchema, skillsetSchema } from '$lib/schemas';
// import { findFirst, forbidIf, isAllowed, pick } from '$lib/server-utils';
// import { hasPerms } from '$lib/utils';
// import { getOrCreateMap } from '$trpc/helpers';

// const pooledMapsMutationSchema = z.object({
//   skillsets: skillsetSchema.array(),
//   comment: z.string().nullish().optional()
// });

// export const pooledMapsRouter = t.router({
//   createMap: t.procedure
//     .use(getUserAsStaffWithRound)
//     .input(
//       withRoundSchema.extend({
//         data: pooledMapsMutationSchema.extend({
//           slot: z.number().int().gte(1),
//           modpoolId: z.number().int(),
//           osuBeatmapId: z.number().int()
//         })
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin ||
//           hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pooled_maps']),
//         `create pooled beatmap for tournament of ID ${input.tournamentId}`
//       );

//       forbidIf.doesntIncludeService(ctx.tournament, 'mappooling');
//       forbidIf.hasConcluded(ctx.tournament);
//       forbidIf.poolIsPublished(ctx.round);

//       let {
//         tournamentId,
//         roundId,
//         data: { modpoolId, osuBeatmapId, skillsets, comment, slot }
//       } = input;

//       let suggestedMap = findFirst(
//         await db
//           .select(pick(dbSuggestedMap, ['beatmapId', 'suggestedByStaffMemberId']))
//           .from(dbSuggestedMap)
//           .where(
//             and(eq(dbSuggestedMap.beatmapId, osuBeatmapId), eq(dbSuggestedMap.modpoolId, modpoolId))
//           )
//       );

//       if (suggestedMap) {
//         await tryCatch(async () => {
//           if (!suggestedMap) return;

//           await db.insert(dbPooledMap).values({
//             slot,
//             skillsets,
//             tournamentId,
//             roundId,
//             modpoolId,
//             poolerComment: comment,
//             beatmapId: suggestedMap.beatmapId,
//             suggestedByStaffMemberId: suggestedMap.suggestedByStaffMemberId,
//             pooledByStaffMemberId: ctx.staffMember.id
//           });
//         }, "Can't create pooled beatmap.");

//         return;
//       }

//       let map = await getOrCreateMap(db, ctx.user.osuAccessToken, osuBeatmapId, modpoolId);

//       await tryCatch(async () => {
//         await db.insert(dbPooledMap).values({
//           slot,
//           skillsets,
//           tournamentId,
//           roundId,
//           modpoolId,
//           poolerComment: comment,
//           beatmapId: map.osuBeatmapId,
//           suggestedByStaffMemberId: ctx.staffMember.id,
//           pooledByStaffMemberId: ctx.staffMember.id
//         });
//       }, "Can't create pooled beatmap.");
//     }),
//   updateMap: t.procedure
//     .use(getUserAsStaffWithRound)
//     .input(
//       withRoundSchema.extend({
//         where: whereIdSchema,
//         data: pooledMapsMutationSchema.deepPartial()
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         ctx.user.isAdmin ||
//           hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'mutate_pooled_maps']),
//         `update pooled beatmap of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);

//       if (Object.keys(input.data).length === 0) return;

//       let {
//         where,
//         data: { skillsets, comment }
//       } = input;

//       await tryCatch(async () => {
//         await db
//           .update(dbPooledMap)
//           .set({
//             skillsets,
//             poolerComment: comment
//           })
//           .where(eq(dbPooledMap.id, where.id));
//       }, `Can't update pooled beatmap of ID ${where.id}.`);
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
//           hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug', 'delete_pooled_maps']),
//         `delete pooled beatmap of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);
//       forbidIf.poolIsPublished(ctx.round);

//       let { where } = input;

//       await tryCatch(async () => {
//         await db.delete(dbPooledMap).where(eq(dbPooledMap.id, where.id));
//       }, `Can't delete pooled beatmap of ID ${where.id}.`);
//     })
// });

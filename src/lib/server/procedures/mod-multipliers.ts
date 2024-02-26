// import db from '$db';
// import { dbModMultiplier } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import { z } from 'zod';
// import { t, tryCatch } from '$trpc';
// import { getUserAsStaff } from '$trpc/middleware';
// import { whereIdSchema, withTournamentSchema } from '$lib/schemas';
// import { forbidIf, isAllowed } from '$lib/server/utils';
// import { hasPerms } from '$lib/utils';
// import { modSchema } from '$lib/schemas';

// const multiplierMutationSchema = z.object({
//   mods: z.array(modSchema),
//   value: z.number()
// });

// export const modMultipliersRouter = t.router({
//   createMultiplier: t.procedure
//     .use(getUserAsStaff)
//     .input(
//       withTournamentSchema.extend({
//         data: multiplierMutationSchema
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
//         `create mod multipliers for tournament of ID ${input.tournamentId}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);

//       let { tournamentId, data } = input;

//       await tryCatch(async () => {
//         await db.insert(dbModMultiplier).values({
//           ...data,
//           tournamentId
//         });
//       }, "Can't create mod multiplier.");
//     }),
//   updateMultiplier: t.procedure
//     .use(getUserAsStaff)
//     .input(
//       withTournamentSchema.extend({
//         where: whereIdSchema,
//         data: multiplierMutationSchema.deepPartial()
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
//         `update multiplier of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);

//       if (Object.keys(input.data).length === 0) return;

//       let { tournamentId, where, data } = input;

//       await tryCatch(async () => {
//         await db
//           .update(dbModMultiplier)
//           .set({
//             ...data,
//             tournamentId
//           })
//           .where(eq(dbModMultiplier.id, where.id));
//       }, `Can't update mod multiplier of ID ${where.id}.`);
//     }),
//   deleteMultiplier: t.procedure
//     .use(getUserAsStaff)
//     .input(
//       withTournamentSchema.extend({
//         where: whereIdSchema
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       isAllowed(
//         hasPerms(ctx.staffMember, ['mutate_tournament', 'host', 'debug']),
//         `delete mod multiplier of ID ${input.where.id}`
//       );

//       forbidIf.hasConcluded(ctx.tournament);

//       let { where } = input;

//       await tryCatch(async () => {
//         await db.delete(dbModMultiplier).where(eq(dbModMultiplier.id, where.id));
//       }, `Can't delete mod multiplier of ID ${where.id}.`);
//     })
// });

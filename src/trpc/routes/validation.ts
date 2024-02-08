// import db from '$db';
// import { dbTournament, dbRound, dbModMultiplier, dbStaffRole } from '$db/schema';
// import { eq, and } from 'drizzle-orm';
// import { getRowCount, pick, findFirst } from '$lib/server-utils';
// import { t, tryCatch } from '$trpc';
// import { z } from 'zod';
// import { withTournamentSchema, modSchema } from '$lib/schemas';

// export const validationRouter = t.router({
//   isTournamentNameUnique: t.procedure.input(z.string()).query(async ({ input }) => {
//     let tournamentCount = await tryCatch(async () => {
//       return await getRowCount(dbTournament, eq(dbTournament.name, input));
//     }, "Can't get tournament to validate name uniqueness.");

//     return tournamentCount === 0;
//   }),
//   isRoundNameUniqueInTournament: t.procedure
//     .input(
//       withTournamentSchema.extend({
//         name: z.string(),
//         roundId: z.number().int().optional()
//       })
//     )
//     .query(async ({ input: { roundId, name, tournamentId } }) => {
//       let round = await tryCatch(async () => {
//         return findFirst(
//           await db
//             .select(pick(dbRound, ['id']))
//             .from(dbRound)
//             .where(and(eq(dbRound.name, name), eq(dbRound.tournamentId, tournamentId)))
//             .limit(1)
//         );
//       }, "Can't get round to validate name uniqueness.");

//       return !round || (!!roundId && round.id === roundId);
//     }),
//   areModsUniqueInTournament: t.procedure
//     .input(
//       withTournamentSchema.extend({
//         mods: z.array(modSchema),
//         multiplierId: z.number().int().optional()
//       })
//     )
//     .query(async ({ input: { tournamentId, mods, multiplierId } }) => {
//       let multiplier = await tryCatch(async () => {
//         return findFirst(
//           await db
//             .select(pick(dbModMultiplier, ['id']))
//             .from(dbModMultiplier)
//             .where(
//               and(eq(dbModMultiplier.mods, mods), eq(dbModMultiplier.tournamentId, tournamentId))
//             )
//             .limit(1)
//         );
//       }, "Can't get mod multiplier to validate mods uniqueness.");

//       return !multiplier || (!!multiplierId && multiplier.id === multiplierId);
//     }),
//   isStaffRoleNameUniqueInTournament: t.procedure
//     .input(
//       withTournamentSchema.extend({
//         name: z.string(),
//         staffRoleId: z.number().int().optional()
//       })
//     )
//     .query(async ({ input: { tournamentId, name, staffRoleId } }) => {
//       let staffRole = await tryCatch(async () => {
//         return findFirst(
//           await db
//             .select(pick(dbStaffRole, ['id']))
//             .from(dbStaffRole)
//             .where(and(eq(dbStaffRole.name, name), eq(dbStaffRole.tournamentId, tournamentId)))
//             .limit(1)
//         );
//       }, "Can't get staff role to validate name uniqueness.");

//       return !staffRole || (!!staffRoleId && staffRole.id === staffRoleId);
//     })
// });

// import db from '$db';
// import { dbTournament } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import { findFirst, pick } from '$lib/server-utils';
// import { z } from 'zod';
// import { error } from '@sveltejs/kit';
// import type { LayoutServerLoad } from './$types';

// export const load = (async ({ parent, params }) => {
//   let data = await parent();
//   let tournamentId = z.number().int().parse(Number(params.tournamentId));

//   let tournament = findFirst(
//     await db
//       .select(pick(dbTournament, ['id', 'name', 'acronym', 'type', 'services']))
//       .from(dbTournament)
//       .where(eq(dbTournament.id, tournamentId))
//   );

//   if (!tournament) {
//     throw error(404, `Couldn't find tournament with ID ${tournamentId}.`);
//   }

//   return {
//     ...data,
//     tournament
//   };
// }) satisfies LayoutServerLoad;

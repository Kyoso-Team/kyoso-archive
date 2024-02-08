// import db from '$db';
// import { dbModMultiplier } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import { hasPerms } from '$lib/utils';
// import { pick } from '$lib/server-utils';
// import { error } from '@sveltejs/kit';
// import type { PageServerLoad } from './$types';

// export const load = (async ({ parent }) => {
//   let data = await parent();

//   if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
//     throw error(
//       401,
//       `You lack the necessary permissions to manage the mod multipliers for tournament of ID ${data.tournament.id}.`
//     );
//   }

//   let modMultipliers = await db
//     .select(pick(dbModMultiplier, ['id', 'mods', 'value']))
//     .from(dbModMultiplier)
//     .where(eq(dbModMultiplier.tournamentId, data.tournament.id));

//   return {
//     modMultipliers,
//     id: data.tournament.id,
//     name: data.tournament.name,
//     acronym: data.tournament.acronym
//   };
// }) satisfies PageServerLoad;

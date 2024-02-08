// import db from '$db';
// import { dbTournament } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import { findFirstOrThrow, pick } from '$lib/server-utils';
// import { hasPerms } from '$lib/utils';
// import { error } from '@sveltejs/kit';
// import type { PageServerLoad } from './$types';

// export const load = (async ({ parent }) => {
//   let data = await parent();

//   if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
//     throw error(
//       401,
//       `You lack the necessary permissions to manage the dates for tournament of ID ${data.tournament.id}.`
//     );
//   }

//   let tournament = findFirstOrThrow(
//     await db
//       .select(
//         pick(dbTournament, [
//           'playerRegsOpenOn',
//           'playerRegsCloseOn',
//           'staffRegsOpenOn',
//           'staffRegsCloseOn',
//           'goPublicOn',
//           'concludesOn'
//         ])
//       )
//       .from(dbTournament)
//       .where(eq(dbTournament.id, data.tournament.id)),
//     'tournament'
//   );

//   return {
//     id: data.tournament.id,
//     name: data.tournament.name,
//     acronym: data.tournament.acronym,
//     ...tournament
//   };
// }) satisfies PageServerLoad;

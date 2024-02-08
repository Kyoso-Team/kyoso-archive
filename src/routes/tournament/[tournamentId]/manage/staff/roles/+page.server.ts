// import db from '$db';
// import { dbStaffRole } from '$db/schema';
// import { eq, and, gt, asc } from 'drizzle-orm';
// import { hasPerms } from '$lib/utils';
// import { pick } from '$lib/server-utils';
// import { error } from '@sveltejs/kit';
// import type { PageServerLoad } from './$types';

// export const load = (async ({ parent }) => {
//   let data = await parent();

//   if (!hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_staff_members'])) {
//     throw error(
//       401,
//       `You lack the necessary permissions to manage the staff roles for tournament of ID ${data.tournament.id}.`
//     );
//   }

//   let roles = await db
//     .select(pick(dbStaffRole, ['id', 'name', 'order', 'permissions', 'color']))
//     .from(dbStaffRole)
//     .where(and(eq(dbStaffRole.tournamentId, data.tournament.id), gt(dbStaffRole.order, 1)))
//     .orderBy(asc(dbStaffRole.order));

//   return {
//     roles,
//     tournament: {
//       id: data.tournament.id,
//       name: data.tournament.name,
//       acronym: data.tournament.acronym
//     }
//   };
// }) satisfies PageServerLoad;

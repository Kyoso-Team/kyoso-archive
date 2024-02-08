// import db from '$db';
// import { getSession } from '$lib/server-utils';
// import { error } from '@sveltejs/kit';
// import type { PageServerLoad } from './$types';

// export const load = (async (event) => {
//   let storedUser = getSession(event, true);

//   let user = await db.query.dbUser.findFirst({
//     columns: {
//       id: true,
//       discordUserId: true,
//       showDiscordTag: true,
//       apiKey: true
//     },
//     where: (user, { eq }) => eq(user.id, storedUser.id)
//   });

//   if (!user) {
//     throw error(404, 'User not found');
//   }

//   let purchases = await db.query.dbPurchase.findMany({
//     columns: {
//       payPalOrderId: true,
//       purchasedAt: true,
//       cost: true,
//       services: true
//     },
//     with: {
//       forTournament: {
//         columns: {
//           id: true,
//           name: true
//         }
//       }
//     },
//     where: (purchase, { eq }) => eq(purchase.purchasedById, user?.id || 0)
//   });

//   return {
//     user,
//     purchases
//   };
// }) satisfies PageServerLoad;

// import * as v from 'valibot';
// import { db, Notification, OsuUser, Tournament, User } from '$db';
import { trpc } from '$lib/server/services';
// import { pick, trpcUnknownError } from '$lib/server/utils';
// import { wrap } from '@typeschema/valibot';
// import { getSession } from '../helpers/trpc';
// import { and, desc, eq, inArray } from 'drizzle-orm';
// import { positiveIntSchema } from '$lib/schemas';

// const getNotifications = t.procedure
//   .input(
//     wrap(
//       v.object({
//         pagination: v.object({
//           limit: positiveIntSchema,
//           offset: positiveIntSchema
//         })
//       })
//     )
//   )
//   .query(async ({ ctx, input }) => {
//     const { pagination } = input;
//     const session = getSession(ctx.cookies, true);

    // let notifications: Pick<typeof Notification.$inferSelect, 'notifiedAt' | 'message' | 'read'>[] =
    //   [];

// const markAllNotificationsAsRead = trpc.procedure.mutation(async ({ ctx }) => {
//   const session = getSession('trpc', ctx.cookies, true);

    // const messageVars = Array.from(
    //   new Set(notifications.map(({ message }) => message.match(/(\w+):(\w+)/g) || []).flat())
    // );

    // const tournamentsToGet: number[] = [];
    // const usersToGet: number[] = [];

    // let tournaments: Pick<typeof Tournament.$inferSelect, 'name' | 'urlSlug'>[] = [];
    // let users: (Pick<typeof User.$inferSelect, 'id'> &
    //   Pick<typeof OsuUser.$inferSelect, 'username'>)[] = [];

    // for (let i = 0; i < messageVars.length; i++) {
    //   const split = messageVars[i].split(':');
    //   const thing = split[0];
    //   const id = split[1];

    //   switch (thing) {
    //     case 'tournament':
    //       tournamentsToGet.push(Number(id));
    //       break;
    //     case 'user':
    //       usersToGet.push(Number(id));
    //       break;
    //     default:
    //       console.warn('Unknown variable in notification message');
    //       break;
    //   }
    // }

    // if (tournamentsToGet.length > 0) {
    //   try {
    //     tournaments = await db
    //       .select(pick(Tournament, ['name', 'urlSlug']))
    //       .from(Tournament)
    //       .where(inArray(Tournament.id, tournamentsToGet));
    //   } catch (err) {
    //     throw trpcUnknownError(err, 'Getting the tournaments');
    //   }
    // }

    // if (usersToGet.length > 0) {
    //   try {
    //     users = await db
    //       .select({
    //         id: User.id,
    //         username: OsuUser.username
    //       })
    //       .from(User)
    //       .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    //       .where(inArray(User.id, usersToGet));
    //   } catch (err) {
    //     throw trpcUnknownError(err, 'Getting the users');
    //   }
    // }

    // return {
    //   notifications,
    //   meta: {
    //     tournaments,
    //     users
    //   }
    // };
  // });

// const markNotificationAsRead = t.procedure
//   .input(wrap(v.object({ notificationId: positiveIntSchema })))
//   .mutation(async ({ ctx, input }) => {
//     const { notificationId } = input;
//     const session = getSession(ctx.cookies, true);

    // try {
    //   await db
    //     .update(Notification)
    //     .set({
    //       read: true
    //     })
    //     .where(and(eq(Notification.userId, session.userId), eq(Notification.id, notificationId)));
    // } catch (err) {
    //   throw trpcUnknownError(err, 'Marking the notification as read');
    // }
//   });

// const markAllNotificationsAsRead = t.procedure.mutation(async ({ ctx }) => {
  // const session = getSession(ctx.cookies, true);

  // try {
  //   await db
  //     .update(Notification)
  //     .set({
  //       read: true
  //     })
  //     .where(and(eq(Notification.userId, session.userId), eq(Notification.read, false)));
  // } catch (err) {
  //   throw trpcUnknownError(err, "Marking all the user's notifications as read");
  // }
// });

export const notificationsRouter = trpc.router({
  // getNotifications,
  // markNotificationAsRead,
  // markAllNotificationsAsRead
});

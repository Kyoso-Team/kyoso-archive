import * as v from 'valibot';
import { db, trpc } from '$lib/server/services';
import { UserNotification } from '$db';
import { trpcUnknownError } from '$lib/server/utils';
import { wrap } from '@typeschema/valibot';
import { getSession } from '$lib/server/helpers/trpc';
import { and, eq } from 'drizzle-orm';
import { positiveIntSchema } from '$lib/schemas';

const markNotificationAsRead = trpc.procedure
  .input(wrap(v.object({ notificationId: positiveIntSchema })))
  .mutation(async ({ ctx, input }) => {
    const { notificationId } = input;
    const session = getSession(ctx.cookies, true);

    try {
      await db
        .update(UserNotification)
        .set({
          read: true
        })
        .where(
          and(
            eq(UserNotification.userId, session.userId),
            eq(UserNotification.notificationId, notificationId)
          )
        );
    } catch (err) {
      throw trpcUnknownError(err, 'Marking the notification as read');
    }
  });

const markAllNotificationsAsRead = trpc.procedure.mutation(async ({ ctx }) => {
  const session = getSession(ctx.cookies, true);

  try {
    await db
      .update(UserNotification)
      .set({
        read: true
      })
      .where(and(eq(UserNotification.userId, session.userId), eq(UserNotification.read, false)));
  } catch (err) {
    throw trpcUnknownError(err, "Marking all the user's notifications as read");
  }
});

export const notificationsRouter = trpc.router({
  markNotificationAsRead,
  markAllNotificationsAsRead
});

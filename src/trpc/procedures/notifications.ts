import { wrap } from '@typeschema/valibot';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';
import { UserNotification } from '$db';
import { getSession } from '$lib/server/context';
import { db, trpc } from '$lib/server/services';
import { trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema } from '$lib/validation';

const markNotificationAsRead = trpc.procedure
  .input(wrap(v.object({ notificationId: positiveIntSchema })))
  .mutation(async ({ ctx, input }) => {
    const { notificationId } = input;
    const session = getSession('trpc', ctx.cookies, true);

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
  const session = getSession('trpc', ctx.cookies, true);

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

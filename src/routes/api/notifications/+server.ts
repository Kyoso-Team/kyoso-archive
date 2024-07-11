import * as v from 'valibot';
import postgres from 'postgres';
import { db, dbClient, UserNotification, Notification } from '$db';
import { createSSESender, getSession } from '$lib/server/helpers/api';
import { notificationListenRespSchema } from '$lib/schemas';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { logError, retryIfError } from '$lib/server/utils';
import { mapNotificationVars } from '$lib/server/helpers/notifications';
import type { SSEConnections } from '$types';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies, route }) => {
  const send = createSSESender<SSEConnections['notifications']>();
  const session = getSession(cookies, true);
  let listener!: postgres.ListenMeta;
  const stream = new ReadableStream({
    start: startStream,
    cancel: cancelStream
  });

  async function startStream(controller: ReadableStreamDefaultController<any>) {
    listener = await dbClient.listen(
      'new_notification',
      (data) => onNewNotificationNotify(controller, data),
      async () => await onNewNotificationListen(controller)
    );
  }

  async function onNewNotificationNotify(controller: ReadableStreamDefaultController<any>, data: any) {
    let notification!: v.Output<typeof notificationListenRespSchema>;

    try {
      notification = v.parse(notificationListenRespSchema, JSON.parse(data));
    } catch (err) {
      const message = await logError(err, 'Validationg the notification', route.id);
      send(controller, 'error', message);
      return;
    }

    if (!(notification.notify === 'all' || notification.notify.includes(session.userId))) return;

    try {
      notification = await retryIfError(async () => {
        return await mapNotificationVars({
          ...notification,
          linkTo: notification.link_to
        });
      }); 
    } catch (err) {
      const message = await logError(err, 'Mapping the notification message', route.id);
      send(controller, 'error', message);
      return;
    }

    const { notify: _, ...rest } = notification;
    send(controller, 'new_notification', rest);
  }

  async function onNewNotificationListen(controller: ReadableStreamDefaultController<any>) {
    let unreadNotificationCount!: number;

    try {
      unreadNotificationCount = await retryIfError(async () => {
        return await db
          .select({ count: count().as('count') })
          .from(UserNotification)
          .innerJoin(Notification, eq(Notification.id, UserNotification.notificationId))
          .where(
            and(
              eq(UserNotification.userId, session.userId),
              eq(UserNotification.read, false),
              isNotNull(Notification.notifiedAt)
            )
          )
          .then(([{ count }]) => count);
      });
    } catch (err) {
      const message = await logError(err, 'Getting the number of unread notifications', route.id);
      send(controller, 'error', message);
      return;
    }

    send(controller, 'notification_count', unreadNotificationCount);
  }

  function cancelStream() {
    listener.unlisten();
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}) satisfies RequestHandler;
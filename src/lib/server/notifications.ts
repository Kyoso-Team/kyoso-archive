import { desc, eq, inArray } from 'drizzle-orm';
import { Notification, OsuUser, Tournament, User, UserNotification } from '$db';
import { db } from '$lib/server/services';
import { pick } from '$lib/server/utils';
import { catcher } from './error';
import type { ErrorInside } from '$lib/types';

export async function getNotifications(
  inside: ErrorInside,
  userId: number,
  pagination: { limit: number; offset: number }
) {
  const notifications = await db
    .select({
      notifiedAt: UserNotification.notifiedAt,
      read: UserNotification.read,
      message: Notification.message
    })
    .from(UserNotification)
    .innerJoin(Notification, eq(Notification.id, UserNotification.notificationId))
    .where(eq(UserNotification.userId, userId))
    .orderBy(desc(UserNotification.notifiedAt))
    .limit(pagination.limit)
    .offset(pagination.offset)
    .catch(catcher(inside, 'Getting the notifications'));

  const messageVars = Array.from(
    new Set(notifications.map(({ message }) => message.match(/(\w+):(\w+)/g) || []).flat())
  );

  const tournamentsToGet: number[] = [];
  const usersToGet: number[] = [];

  let tournaments: Pick<typeof Tournament.$inferSelect, 'name' | 'urlSlug'>[] = [];
  let users: (Pick<typeof User.$inferSelect, 'id'> &
    Pick<typeof OsuUser.$inferSelect, 'username'>)[] = [];

  for (let i = 0; i < messageVars.length; i++) {
    const split = messageVars[i].split(':');
    const thing = split[0];
    const id = split[1];

    switch (thing) {
      case 'tournament':
        tournamentsToGet.push(Number(id));
        break;
      case 'user':
        usersToGet.push(Number(id));
        break;
      default:
        console.warn('Unknown variable in notification message');
        break;
    }
  }

  if (tournamentsToGet.length > 0) {
    tournaments = await db
      .select(pick(Tournament, ['name', 'urlSlug']))
      .from(Tournament)
      .where(inArray(Tournament.id, tournamentsToGet))
      .catch(catcher(inside, 'Getting the tournaments'));
  }

  if (usersToGet.length > 0) {
    users = await db
      .select({
        id: User.id,
        username: OsuUser.username
      })
      .from(User)
      .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
      .where(inArray(User.id, usersToGet))
      .catch(catcher(inside, 'Getting the users'));
  }

  return {
    notifications,
    meta: {
      tournaments,
      users
    }
  };
}

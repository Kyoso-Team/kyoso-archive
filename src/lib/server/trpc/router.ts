import { usersRouter, tournamentsRouter, notificationsRouter } from '../procedures';
import { t } from '$trpc';

export const router = t.router({
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter
});

export type Router = typeof router;

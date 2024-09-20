import { trpc } from '$lib/server/services';
import { search } from './procedures';
import { notificationsRouter } from './procedures/notifications';
import { staffRolesRouter } from './procedures/staff-roles';
import { tournamentsRouter } from './procedures/tournaments';
import { usersRouter } from './procedures/users';

export const router = trpc.router({
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter,
  staffRoles: staffRolesRouter,
  search
});

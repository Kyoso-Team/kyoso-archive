import { trpc } from '$lib/server/services';
import { usersRouter } from './procedures/users';
import { tournamentsRouter } from './procedures/tournaments';
import { notificationsRouter } from './procedures/notifications';
import { staffRolesRouter } from './procedures/staff-roles';
import { search } from './procedures';

export const router = trpc.router({
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter,
  staffRoles: staffRolesRouter,
  search
});

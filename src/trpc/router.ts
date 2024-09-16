import { trpc } from '$lib/server/services';
import { usersRouter, tournamentsRouter, notificationsRouter, staffRolesRouter, formsRouter, rootProcedures } from './procedures';

export const router = trpc.router({
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter,
  staffRoles: staffRolesRouter,
  forms: formsRouter,
  ...rootProcedures
});

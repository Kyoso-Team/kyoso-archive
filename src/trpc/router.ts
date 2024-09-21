import { trpc } from '$lib/server/services';
import {
  formsRouter,
  notificationsRouter,
  rootProcedures,
  staffRolesRouter,
  tournamentsRouter,
  usersRouter
} from './procedures';

export const router = trpc.router({
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter,
  staffRoles: staffRolesRouter,
  forms: formsRouter,
  ...rootProcedures
});

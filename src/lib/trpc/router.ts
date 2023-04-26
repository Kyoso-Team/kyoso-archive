import { authRouter, tournamentRouter, uploadRouter, usersRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  users: usersRouter
});

export type Router = typeof router;

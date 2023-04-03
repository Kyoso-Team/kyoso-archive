import { authRouter, tournamentRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter
});

export type Router = typeof router;

import { authRouter, tournamentRouter, uploadRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter
});

export type Router = typeof router;

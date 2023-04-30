import { authRouter, tournamentRouter, uploadRouter, validationRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  validation: validationRouter
});

export type Router = typeof router;

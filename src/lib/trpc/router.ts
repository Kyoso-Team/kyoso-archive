import { authRouter, tournamentRouter, imagesRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  images: imagesRouter
});

export type Router = typeof router;

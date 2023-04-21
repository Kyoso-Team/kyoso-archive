import { authRouter, tournamentRouter, uploadRouter, settingsRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  settings: settingsRouter
});

export type Router = typeof router;

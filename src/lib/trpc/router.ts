import { authRouter } from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter
});

export type Router = typeof router;

import {
  authRouter,
  tournamentRouter,
  uploadRouter,
  validationRouter,
  usersRouter
} from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  validation: validationRouter,
  users: usersRouter
});

export type Router = typeof router;

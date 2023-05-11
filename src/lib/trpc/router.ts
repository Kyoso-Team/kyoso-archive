import {
  authRouter,
  tournamentRouter,
  uploadRouter,
  validationRouter,
  usersRouter,
  stagesRouter,
  roundsRouter
} from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  validation: validationRouter,
  users: usersRouter,
  stages: stagesRouter,
  rounds: roundsRouter
});

export type Router = typeof router;

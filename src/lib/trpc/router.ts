import {
  authRouter,
  tournamentRouter,
  uploadRouter,
  validationRouter,
  usersRouter,
  stagesRouter,
  roundsRouter,
  modMultipliersRouter
} from './routes';
import { t } from '$trpc';

export const router = t.router({
  auth: authRouter,
  tournaments: tournamentRouter,
  uploads: uploadRouter,
  validation: validationRouter,
  users: usersRouter,
  stages: stagesRouter,
  rounds: roundsRouter,
  modMultipliers: modMultipliersRouter
});

export type Router = typeof router;

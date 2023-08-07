import {
  authRouter,
  tournamentRouter,
  uploadRouter,
  validationRouter,
  usersRouter,
  stagesRouter,
  roundsRouter,
  modMultipliersRouter,
  prizesRouter,
  staffMembersRouter,
  staffRolesRouter,
  modpoolsRouter,
  pooledMapsRouter,
  suggestedMapsRouter
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
  modMultipliers: modMultipliersRouter,
  prizes: prizesRouter,
  staffMembers: staffMembersRouter,
  staffRoles: staffRolesRouter,
  modpools: modpoolsRouter,
  pooledMaps: pooledMapsRouter,
  suggestedMaps: suggestedMapsRouter
});

export type Router = typeof router;

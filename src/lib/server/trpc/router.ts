import { usersRouter, tournamentsRouter } from '../procedures';
import { t } from '$trpc';

export const router = t.router({
  tournaments: tournamentsRouter,
  users: usersRouter
  // stages: stagesRouter,
  // rounds: roundsRouter,
  // modMultipliers: modMultipliersRouter,
  // prizes: prizesRouter,
  // staffMembers: staffMembersRouter,
  // staffRoles: staffRolesRouter,
  // modpools: modpoolsRouter,
  // pooledMaps: pooledMapsRouter,
  // suggestedMaps: suggestedMapsRouter,
  // markdown: markdownRouter
});

export type Router = typeof router;

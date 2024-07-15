import '../utils/mocks';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCaller } from '../utils/trpc';
import { createMockUser, truncateTables } from '../utils/db';
import { Tournament, User } from '$db';
import { TRPCError } from '@trpc/server';
import type { AuthSession } from '$types';

describe('tRPC router: tournaments', async () => {
  const tournamentInsert = Object.freeze({
    acronym: 'TT',
    name: 'Test Tournament',
    urlSlug: 'tt',
    type: 'solo'
  } satisfies typeof Tournament.$inferInsert);
  let notApprovedHost!: Readonly<AuthSession>;
  let approvedHost!: Readonly<AuthSession>;

  beforeAll(async () => {
    await truncateTables([User, Tournament]);

    notApprovedHost = await createMockUser({ approvedHost: false });
    approvedHost = await createMockUser({ approvedHost: true });
  });

  describe('tRPC procedure: createTournament', async () => {
    beforeEach(async () => {
      await truncateTables(Tournament);
    });

    it('Errors if the user is not an approved host', async () => {
      const trpc = await createCaller(notApprovedHost);
      const promise = trpc.tournaments.createTournament({
        ...tournamentInsert,
        rankRange: null,
        teamSettings: null
      });

      await expect(promise).rejects.toThrowError(TRPCError);
    });

    it('Returns a string if the tournament name or URL slug is not unique', async () => {
      const trpc = await createCaller(approvedHost);

      const t1 = await trpc.tournaments.createTournament({
        ...tournamentInsert,
        name: 'Tournament 1',
        urlSlug: 'slug_1',
        rankRange: null,
        teamSettings: null
      });
      const [t2, t3] = await Promise.all([
        trpc.tournaments.createTournament({
          ...tournamentInsert,
          name: 'Tournament 1',
          rankRange: null,
          teamSettings: null
        }),
        trpc.tournaments.createTournament({
          ...tournamentInsert,
          urlSlug: 'slug_1',
          rankRange: null,
          teamSettings: null
        })
      ]);

      expect(typeof t1 === 'object' && typeof t2 === 'string' && typeof t3 === 'string').toBe(true);
    });

    it('Creates a tournament', async () => {
      const trpc = await createCaller(approvedHost);
      const soloTournamentPromise = trpc.tournaments.createTournament({
        ...tournamentInsert,
        rankRange:  null,
        teamSettings: null,
        type: 'solo',
        name: 'Solo Tournament',
        urlSlug: 'st'
      });
      const teamTournamentPromise = trpc.tournaments.createTournament({
        ...tournamentInsert,
        rankRange:  null,
        teamSettings: {
          maxTeamSize: 2,
          minTeamSize: 1
        },
        type: 'teams',
        name: 'Team Tournament',
        urlSlug: 'tt'
      });
      const withRankRangePromise = trpc.tournaments.createTournament({
        ...tournamentInsert,
        rankRange:  {
          lower: 10000,
          upper: 100000
        },
        teamSettings: null,
        type: 'solo',
        name: 'Solo Tournament 2',
        urlSlug: 'st2'
      });

      const spy = vi.fn(() => Promise.all([soloTournamentPromise, teamTournamentPromise, withRankRangePromise]));
      await spy();
      expect(spy).toHaveResolved();
    });
  });

  // describe('tRPC procedure: updateTournament', async () => {
  //   let tournament!: Pick<typeof Tournament.$inferSelect, 'id'>;

  //   beforeAll(async () => {
  //     await truncateTables(Tournament);

  //     const trpc = await createCaller(approvedHost);
  //     tournament = await trpc.tournaments.createTournament({
  //       ...tournamentInsert,
  //     });
  //   });
  // });
});

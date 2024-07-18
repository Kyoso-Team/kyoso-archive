import '$tests/utils/polyfill';
import { beforeAll, describe, expect, it } from 'vitest';
import { createCaller } from '$tests/utils/trpc';
import { createMockUser, truncateTables } from '$tests/utils/db';
import { Tournament, User } from '$db';
import { TRPCError } from '@trpc/server';
import { randomInt } from 'crypto';
import type { AuthSession, TRPCRouter } from '$types';

describe('tRPC router: tournaments', async () => {
  let notApprovedHost!: Readonly<AuthSession>;
  let approvedHost!: Readonly<AuthSession>;

  beforeAll(async () => {
    await truncateTables([User, Tournament]);
    notApprovedHost = await createMockUser({ approvedHost: false, admin: true });
    approvedHost = await createMockUser({ approvedHost: true });
  });

  describe.concurrent('tRPC procedure: createTournament', async () => {
    const returnValue = { urlSlug: expect.any(String) };
    const insert = (): Readonly<TRPCRouter<true>['tournaments']['createTournament']> => {
      const n = randomInt(1, 100);
      return {
        acronym: 'TT',
        name: `Test Tournament ${n}`,
        urlSlug: `tt-${n}`,
        type: 'solo',
        rankRange: null,
        teamSettings: null
      };
    };

    describe.concurrent('Authorization', () => {
      it('Errors if the user is not an approved host (regardless of their admin status)', async () => {
        const trpc = await createCaller(notApprovedHost);
        const promise = trpc.tournaments.createTournament(insert());
        await expect(promise).rejects.toThrowError(TRPCError);
      });

      it('Succeeds if the user is an approved host', async () => {
        const trpc = await createCaller(approvedHost);
        const tournament = await trpc.tournaments.createTournament(insert());
        expect(tournament).toEqual(returnValue);
      });
    });

    describe.concurrent('Validation', () => {
      let trpc!: Awaited<ReturnType<typeof createCaller>>;

      beforeAll(async () => {
        trpc = await createCaller(approvedHost);
      });

      // tournamentChecks is tested in tests/unit/checks.test.ts
      it('Errors if the rank range is invalid (tests if tournamentChecks is called)', async () => {
        const promise = trpc.tournaments.createTournament({
          ...insert(),
          rankRange: {
            lower: 1000,
            upper: 100
          }
        });
        await expect(promise).rejects.toThrowError(TRPCError);
      });
    });

    describe.concurrent('Error handling', () => {
      let trpc!: Awaited<ReturnType<typeof createCaller>>;

      beforeAll(async () => {
        trpc = await createCaller(approvedHost);

        await trpc.tournaments.createTournament({
          ...insert(),
          name: 'Tournament 1',
          urlSlug: 'slug-1'
        });
      });

      it('Catches the tournament name unique constraint violation error and returns it as a string', async () => {
        const err = await trpc.tournaments.createTournament({
          ...insert(),
          name: 'Tournament 1'
        });
        expect(err).toBeTypeOf('string');
      });

      it('Catches the tournament URL slug unique constraint violation error and returns it as a string', async () => {
        const err = await trpc.tournaments.createTournament({
          ...insert(),
          urlSlug: 'slug-1'
        });
        expect(err).toBeTypeOf('string');
      });
    });

    describe.concurrent('Success', () => {
      let trpc!: Awaited<ReturnType<typeof createCaller>>;

      beforeAll(async () => {
        trpc = await createCaller(approvedHost);
      });

      it('Creates an open rank solo tournament', async () => {
        const tournament = await trpc.tournaments.createTournament({
          rankRange:  null,
          teamSettings: null,
          type: 'solo',
          name: 'Solo Tournament',
          urlSlug: 'st',
          acronym: 'ST'
        });
        expect(tournament).toEqual(returnValue);
      });

      it('Creates an open rank teams tournament', async () => {
        const tournament = await trpc.tournaments.createTournament({
          rankRange:  null,
          teamSettings: {
            maxTeamSize: 2,
            minTeamSize: 1
          },
          type: 'teams',
          name: 'Teams Tournament',
          urlSlug: 'tt',
          acronym: 'TT'
        });
        expect(tournament).toEqual(returnValue);
      });

      it('Creates a rank restricted draft tournament', async () => {
        const tournament = await trpc.tournaments.createTournament({
          rankRange:  {
            lower: 10000,
            upper: 100000
          },
          teamSettings: {
            maxTeamSize: 2,
            minTeamSize: 1
          },
          type: 'draft',
          name: 'Draft Tournament',
          urlSlug: 'dt',
          acronym: 'DT'
        });
        expect(tournament).toEqual(returnValue);
      });
    });
  });
});

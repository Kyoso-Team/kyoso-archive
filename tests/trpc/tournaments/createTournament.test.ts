import { beforeEach, describe, expect, test } from 'bun:test';
import { truncateTables } from '$lib/server/queries';
import { trpc, cookies } from '$tests/trpc/client';
import { Tournament } from '$db';
import type { TRPCRouterInputs } from '$lib/types';

async function setCorrectPermissions() {
  return await cookies.setSessionCookie({ approvedHost: true });
}

const dummyTournament: TRPCRouterInputs['tournaments']['createTournament'] = {
  acronym: 'TT',
  name: 'Test Tournament',
  urlSlug: 'tt',
  type: 'solo',
  rankRange: null,
  teamSettings: null
};

beforeEach(async () => {
  await truncateTables('user_tables', Tournament);
  await cookies.setSessionCookie(undefined);
});

describe('trpc.tournaments.createTournament', () => {
  test('Auth: Not an approved host', async () => {
    await cookies.setSessionCookie({
      approvedHost: false,
      admin: true
    });
    
    const promise = trpc.tournaments.createTournament(dummyTournament);
    expect(promise).rejects.toThrowTRPCError('UNAUTHORIZED');
  });

  test('Auth: Approved host', async () => {
    await cookies.setSessionCookie({
      approvedHost: true,
      admin: false
    });

    const tournament = await trpc.tournaments.createTournament(dummyTournament);
    expect(tournament).toEqual({
      id: 1,
      urlSlug: 'tt'
    });
  });

  test('Validation: Executes tournamentChecks', async () => {
    await setCorrectPermissions();

    const promise = trpc.tournaments.createTournament({
      ...dummyTournament,
      rankRange: {
        lower: 2,
        upper: 1
      }
    });
    expect(promise).rejects.toThrowTRPCError('BAD_REQUEST');
  });

  test('Success: Creates open rank solo tournament', async () => {
    await setCorrectPermissions();

    const tournament = await trpc.tournaments.createTournament({
      rankRange: null,
      teamSettings: null,
      type: 'solo',
      name: 'Solo Tournament',
      urlSlug: 'st',
      acronym: 'ST'
    });
    expect(tournament).toEqual({
      id: 1,
      urlSlug: 'st'
    });
  });

  test('Success: Creates open rank teams tournament', async () => {
    await setCorrectPermissions();

    const tournament = await trpc.tournaments.createTournament({
      rankRange: null,
      teamSettings: {
        minTeamSize: 2,
        maxTeamSize: 3
      },
      type: 'teams',
      name: 'Teams Tournament',
      urlSlug: 'tt',
      acronym: 'TT'
    });
    expect(tournament).toEqual({
      id: 1,
      urlSlug: 'tt'
    });
  });

  test('Success: Creates rank restricted draft tournament', async () => {
    await setCorrectPermissions();
    
    const tournament = await trpc.tournaments.createTournament({
      rankRange: {
        lower: 1,
        upper: 10_000
      },
      teamSettings: {
        minTeamSize: 2,
        maxTeamSize: 3
      },
      type: 'draft',
      name: 'Draft Tournament',
      urlSlug: 'dt',
      acronym: 'DT'
    });
    expect(tournament).toEqual({
      id: 1,
      urlSlug: 'dt'
    });
  });

  test('Expected error: Tournament name already exists', async () => {
    await setCorrectPermissions();
    await trpc.tournaments.createTournament({
      ...dummyTournament,
      name: 'name'
    });

    const error = await trpc.tournaments.createTournament({
      ...dummyTournament,
      name: 'name'
    });
    expect(error).toBeTypeOf('string');
  });

  test('Expected error: Tournament slug already exists', async () => {
    await setCorrectPermissions();
    await trpc.tournaments.createTournament({
      ...dummyTournament,
      urlSlug: 'slug'
    });

    const error = await trpc.tournaments.createTournament({
      ...dummyTournament,
      urlSlug: 'slug'
    });
    expect(error).toBeTypeOf('string');
  });
});

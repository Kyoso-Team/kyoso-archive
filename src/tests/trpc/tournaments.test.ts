import '../utils/mocks';
// import { trpc } from '$lib/trpc';
// import { beforeAll, describe, expect, it, vi } from 'vitest';
// import { createCaller } from '../utils/trpc';
// import { createMockSession, truncateTables } from '../utils/db';
// import { DiscordUser, OsuUser, Tournament, User } from '$db';
// import type { AuthSession } from '$types';

// describe('tRPC procedures: Tournaments', () => {
//   let notApprovedHost!: AuthSession;
//   let approvedHost!: AuthSession;

//   beforeAll(async () => {
//     await truncateTables([User, Tournament]);
//     notApprovedHost = await createMockSession();
//     approvedHost = await createMockSession({ approvedHost: true });
//   });

//   it('test', () => {
//     expect(1).toBe(1);
//   });
// });
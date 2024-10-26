import { TRPCError } from '@trpc/server';
import { beforeAll, expect } from 'bun:test';
import { applyMigrations, resetDatabase } from '$lib/server/queries';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

beforeAll(async () => {
  await resetDatabase();
  await applyMigrations();
});

expect.extend({
  toThrowTRPCError(actual: unknown, code: TRPC_ERROR_CODE_KEY) {
    return {
      pass: actual instanceof TRPCError && actual.code === code,
      message: () => `Expected: TRPCError with code ${code}. Received: ${actual}`
    };
  }
});

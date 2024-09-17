import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

interface CustomMatchers {
  toThrowTRPCError(code: TRPC_ERROR_CODE_KEY): void;
}

declare module 'bun:test' {
  interface Matchers extends CustomMatchers {}
  interface AsymmetricMatchers {}
}

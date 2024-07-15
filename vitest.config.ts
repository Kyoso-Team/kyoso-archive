/// <reference types="vitest" />
import { defineConfig } from 'vite';

function lib(path?: string) {
  const base = `${process.cwd()}/src/lib`;
  return path ? `${base}/${path}` : base;
}

export default defineConfig({
  test: {
    include: ['**/tests/**/*.test.ts'],
    exclude: ['**/tests/e2e/**'],
    alias: {
      $lib: lib(),
      $stores: lib('stores'),
      $types: lib('types'),
      $components: lib('components'),
      $trpc: lib('server/trpc'),
      $db: lib('server/db'),
      $tests: `${process.cwd()}/tests`
    },
    globalSetup: ['./tests/global-setup.ts']
  }
});

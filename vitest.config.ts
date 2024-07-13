/// <reference types="vitest" />
import { defineConfig } from 'vite';

function lib(path?: string) {
  const base = `${process.cwd()}/src/lib`;
  return path ? `${base}/${path}` : base;
}

export default defineConfig({
  test: {
    include: ['**/src/tests/**/*.test.ts'],
    exclude: ['**/src/tests/e2e/**'],
    alias: {
      $lib: lib(),
      $stores: lib('stores'),
      $types: lib('types'),
      $components: lib('components'),
      $trpc: lib('server/trpc'),
      $db: lib('server/db')
    }
  }
});

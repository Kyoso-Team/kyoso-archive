/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['**/tests/**/*.test.ts'],
    exclude: ['**/tests/components/**'],
    globalSetup: ['./tests/global-setup.ts']
  }
});

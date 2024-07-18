/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting({ autoCleanup: false })],
  test: {
    unstubGlobals: true,
    environment: 'jsdom',
    include: ['**/tests/components/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts']
  }
});

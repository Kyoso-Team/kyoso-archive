import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

function src(path) {
  return `${process.cwd()}/src/${path}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $trpc: src('trpc'),
      $stores: src('stores'),
      $types: src('lib/types'),
      $components: src('components'),
      $classes: src('classes'),
      $db: src('db')
    }
  }
};

export default config;

import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

function lib(path) {
  return `${process.cwd()}/src/lib/${path}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $stores: lib('stores'),
      $types: lib('types'),
      $components: lib('components'),
      $trpc: lib('server/trpc'),
      $db: lib('server/db')
    }
  }
};

export default config;

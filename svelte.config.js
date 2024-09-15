import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const cwd = process.cwd();

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $stores: `${cwd}/src/lib/stores`,
      $types: `${cwd}/src/lib/types`,
      $components: `${cwd}/src/lib/components`,
      $trpc: `${cwd}/src/trpc`,
      $db: `${cwd}/src/db`
    }
  }
};

export default config;

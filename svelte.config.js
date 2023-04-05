import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $prisma: `${process.cwd()}/src/lib/prisma`,
      $trpc: `${process.cwd()}/src/lib/trpc`,
      $stores: `${process.cwd()}/src/lib/stores`,
      $types: `${process.cwd()}/src/lib/types`,
      $components: `${process.cwd()}/src/components`
    }
  }
};

export default config;

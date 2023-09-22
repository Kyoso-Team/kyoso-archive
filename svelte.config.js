import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';

const src = `${process.cwd()}/src/`;
const lib = `${src}lib/`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $trpc: `${lib}trpc`,
      $stores: `${lib}stores`,
      $types: `${lib}types`,
      $components: `${src}components`,
      $paypal: `${lib}paypal`,
      $classes: `${lib}classes`,
      $db: `${lib}db`,
      $forms: `${src}forms`
    }
  }
};

export default config;

import forms from '@tailwindcss/forms';
import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { theme } from './src/theme';
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  theme: {
    extend: {
      screens: {
        '2lg': '1100px',
        '2md': '900px',
        '2sm': '525px',
        'xs': '450px'
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        }
      },
      animation: {
        'fade-in': 'fade-in 150ms ease'
      }
    }
  },
  plugins: [forms, skeleton({ themes: { custom: [theme] } })]
} satisfies Config;

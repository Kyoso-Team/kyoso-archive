import forms from '@tailwindcss/forms';
import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { theme } from './src/theme';
import type { Config } from 'tailwindcss';
import type { PluginCreator } from 'tailwindcss/types/config';

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
      }
    }
  },
  plugins: [
    forms,
    skeleton({ themes: { custom: [theme] } }),
    (({ addUtilities }) => {
      addUtilities({
        '.variant-soft-indigo': {
          '@apply variant-soft dark:text-indigo-200 text-indigo-700 dark:bg-indigo-500/20 bg-indigo-400/20': {}
        },
        '.variant-soft-blue': {
          '@apply variant-soft dark:text-blue-200 text-blue-700 dark:bg-blue-500/20 bg-blue-400/20': {}
        },
        '.variant-soft-teal': {
          '@apply variant-soft dark:text-teal-200 text-teal-700 dark:bg-teal-500/20 bg-teal-400/20': {}
        },
        '.variant-soft-red': {
          '@apply variant-soft dark:text-red-200 text-red-700 dark:bg-red-500/20 bg-red-400/20': {}
        }
      });
    }) satisfies PluginCreator
  ]
} satisfies Config;

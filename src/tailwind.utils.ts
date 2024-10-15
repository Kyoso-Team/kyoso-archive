import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

const filterColors = [
  'inherit',
  'transparent',
  'current',
  'lightBlue',
  'warmGray',
  'trueGray',
  'coolGray',
  'blueGray',
  'black',
  'white'
];

function reducetoKV(values: string[]) {
  return values.reduce((obj, value) => ({ ...obj, [value]: value }), {});
}

export const customStyles = plugin(({ matchUtilities, addUtilities, addComponents }) => {
  addUtilities({
    '.main': {
      '@apply p-4 sm:p-8 md:p-12 flex': {}
    },
    '.page-content': {
      '@apply w-full max-w-5xl': {}
    },
    'h1 + .line-b': {
      '@apply mt-4 mb-8': {}
    },
    'section + .line-b': {
      '@apply my-8': {}
    },
    'h2 + p, h2 + div, p + div': {
      '@apply mt-4': {}
    },
    '.text-sidenote': {
      '@apply text-surface-600-300-token text-sm': {}
    },
    '.card-grid-2': {
      '@apply grid-cols-[100%] sm:grid-cols-[calc(50%-0.5rem)_calc(50%-0.5rem)]': {}
    },
    '.card-grid-3': {
      '@apply grid-cols-[100%] sm:grid-cols-[calc(50%-0.5rem)_calc(50%-0.5rem)] 2md:grid-cols-[calc(33.33%-0.33rem),_calc(33.34%-0.34rem)_calc(33.33%-0.33rem)]': {}
    }
  });

  addComponents({
    '.card': {
      '@apply w-full gap-4 p-4 ![box-shadow:none] border border-surface-300 dark:border-surface-700': {}
    },
    '.btn': {
      '@apply py-2 px-4 rounded-md': {}
    },
    '.btn-icon': {
      '@apply p-2': {}
    },
    '.input': {
      '@apply py-2 rounded-md': {}
    }
  });

  matchUtilities(
    {
      line: (value) => ({
        [`@apply border-surface-300 dark:border-surface-700 border-${value}`]: {}
      })
    },
    {
      values: reducetoKV(['t', 'b', 'l', 'r'])
    }
  );

  matchUtilities(
    {
      'variant-soft': (value) => ({
        [`@apply variant-soft dark:text-${value}-200 text-${value}-700 dark:bg-${value}-500/20 bg-${value}-400/20`]:
          {}
      })
    },
    {
      values: reducetoKV(Object.keys(colors).filter((key) => !filterColors.includes(key)))
    }
  );
});

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
  'blueGray'
];

function reducetoKV(values: string[]) {
  return values.reduce((obj, value) => ({ ...obj, [value]: value }), {});
}

export const customStyles = plugin(({ matchUtilities, addUtilities }) => {
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

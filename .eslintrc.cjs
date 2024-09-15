module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'drizzle'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte']
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  rules: {
    'quotes': [
      'warn',
      'single',
      {
        avoidEscape: true
      }
    ],
    'semi': ['warn', 'always'],
    'no-var': 'warn',
    'brace-style': ['warn', '1tbs'],
    'comma-dangle': ['warn', 'never'],
    'default-case': 'error',
    'prefer-const': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'quote-props': ['warn', 'consistent'],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    'unused-export-let': 'off',
    'svelte/no-at-html-tags': 'off',
    'drizzle/enforce-delete-with-where': [
      'error',
      {
        drizzleObjectName: 'db'
      }
    ],
    'drizzle/enforce-update-with-where': [
      'error',
      {
        drizzleObjectName: 'db'
      }
    ],
    'no-restricted-imports': [
      'error', {
        patterns: [{
          group: ['drizzle-orm/mysql-core', 'drizzle-orm/sqlite-core'],
          message: 'This project only uses Postgres.'
        }]
      }
    ]
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      files: ['src/lib/*.ts', 'src/lib/(actions|clients|components|stores)/*.ts', 'src/**/*.svelte', 'src/routes/**/!(+page.server|+server|+layout.server).ts'],
      rules: {
        'no-restricted-imports': [
          'error', {
            patterns: [{
              group: ['**/server', '**/server/**/*'],
              message: 'This is a server only module.'
            }]
          }
        ]
      }
    }
  ]
};

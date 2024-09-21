import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import drizzle from 'eslint-plugin-drizzle';
import globals from 'globals';
import parser from 'svelte-eslint-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: [
      '.DS_Store',
      'node_modules',
      'build',
      '.svelte-kit',
      'package',
      '.env',
      '.env.*',
      '!.env.example',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      'bun.lockb',
      '.vercel',
      '.seed-cache',
      '.vscode',
      'migrations',
      'test-results',
      'playwright-report'
    ]
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      drizzle
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        extraFileExtensions: ['.svelte']
      }
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
      '@typescript-eslint/no-empty-object-type': 'off',
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
        'error',
        {
          patterns: [
            {
              group: ['drizzle-orm/mysql-core', 'drizzle-orm/sqlite-core'],
              message: 'This project only uses Postgres.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  },
  {
    files: [
      'src/lib/*.ts',
      'src/lib/(actions|clients|components|stores)/*.ts',
      'src/**/*.svelte',
      'src/routes/**/!(+page.server|+server|+layout.server).ts'
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/server', '**/server/**/*', '$trpc/**/*', '$db/**/*'],
              message: 'This is a server only module. Type imports are allowed though.',
              allowTypeImports: true
            }
          ]
        }
      ]
    }
  }
];
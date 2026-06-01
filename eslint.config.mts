import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
//@ts-ignore
import noComments from 'eslint-plugin-no-comments';

export default defineConfig([
  {
    ignores: [
      '**/sandbox/**', 
      '**/sandbox.*', 
      '**/*sandbox*',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      'no-comments': noComments,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-comments/no-comments': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
    },
  },
  eslintConfigPrettier,
]);

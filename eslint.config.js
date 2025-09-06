import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts', '**/*.svelte'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.svelte'],
      },
      globals: {
        // Browser globals
        console: 'readonly',
        fetch: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        btoa: 'readonly',
        setTimeout: 'readonly',
        AbortController: 'readonly',
        DOMException: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        ReadableStream: 'readonly',
        crypto: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        global: 'readonly',
        // SvelteKit globals
        App: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      svelte: svelte,
      prettier: prettier,
    },
    rules: {
      ...ts.configs.recommended.rules,
      ...svelte.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
        },
      ],
      'no-undef': 'off', // Turn off since we are handling globals above
      'no-empty': 'warn',
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
      'no-sparse-arrays': 'error',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
];

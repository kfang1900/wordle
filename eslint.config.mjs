import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'prettier/prettier': 'error', // Show Prettier issues as ESLint errors
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  prettier, // Disables ESLint rules that conflict with Prettier
  pluginPrettier, // Enables Prettier as an ESLint rule
];

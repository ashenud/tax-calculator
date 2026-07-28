import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    // scripts/ holds working guardrails (plain Node ESM and Python) that predate
    // this scaffold and are not linted by it. dist/ and .astro/ are build output.
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'coverage/**', 'scripts/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
];

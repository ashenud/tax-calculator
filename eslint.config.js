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
  {
    // Test fixtures deliberately construct malformed data to prove the schema
    // rejects it (see src/lib/tax/schema.test.ts, load.test.ts). Typing every
    // mutated path precisely would mean maintaining a second, parallel type just for
    // tests, so `any` is allowed here and nowhere else.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

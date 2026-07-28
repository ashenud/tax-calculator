import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The engine and its fixtures are pure TypeScript — no DOM needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The scaffold ships no tests yet. An empty runner exits 0; a failing runner
    // is not acceptable. P04 onward add the real suites.
    passWithNoTests: true,
  },
});

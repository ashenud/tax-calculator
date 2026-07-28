/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// `getViteConfig` rather than vitest's own `defineConfig`: P01 tests .astro
// components (the ADR-0003 invariants) through Astro's Container API, and that
// needs Astro's Vite plugin in the test pipeline to compile .astro files.
// The engine tests from P04 onward are plain TypeScript and are unaffected.
export default getViteConfig({
  test: {
    // No DOM needed. The engine and its fixtures are pure TypeScript, and the
    // container renders components to an HTML string.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // A failing runner is not acceptable; an empty one is fine while suites are
    // still being added. P04 onward add the engine suites.
    passWithNoTests: true,
    // P07. The default reporter buffers console output per test file and, on a
    // fully passing run in a non-TTY (i.e. CI), prints none of it. The fixture
    // harness has to state on **every** run how many of its figures rest on a
    // rate marked `verified: false` — a suite that reports that only when
    // something else has already failed is reporting it at the wrong moment.
    // This sends the harness's summary straight to stdout instead.
    disableConsoleIntercept: true,
  },
});

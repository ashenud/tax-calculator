// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadTaxYears } from './src/lib/tax/load.ts';

// Tailwind is wired through @tailwindcss/vite, not @astrojs/tailwind. The latter
// peers on astro ^3||^4||^5 and tailwindcss ^3, so it supports neither Astro 7 nor
// Tailwind 4. See docs/prompts/P00-scaffold.md.
//
// `site` and `base` for GitHub Pages are deliberately not set here — P16 owns
// deployment configuration.

/**
 * Validates every file in data/tax-years/ against the Zod schema before the build
 * proceeds. This is what makes schema validation a build-breaking property rather
 * than something that only runs under `npm test` — see docs/prompts/P02-tax-data-schema.md.
 * `loadTaxYears()` throws on the first invalid file; Astro treats a throw from an
 * integration hook as a fatal build error.
 */
function validateTaxData() {
  return {
    name: 'validate-tax-data',
    hooks: {
      'astro:build:start': () => {
        loadTaxYears();
      },
    },
  };
}

/**
 * The P08 component gallery, injected as a route **only under `astro dev`**.
 *
 * Astro routes every file under `src/pages/` in dev and in build alike, and
 * offers no per-page "development only" flag. The `_` filename prefix excludes
 * a file from routing entirely, in dev as well, which is the opposite of what a
 * gallery is for. So the gallery lives outside `src/pages/` — at
 * `src/dev/gallery.astro` — and this integration registers a route pointing at
 * it when, and only when, the command is `dev`.
 *
 * During `astro build` the hook does nothing: the route never exists, the file
 * is never an entry point, and neither it nor anything it imports is reachable
 * from the build graph, so no page and no JavaScript chunk for it is emitted.
 *
 * `src/dev/gallery-excluded-from-build.test.ts` asserts this against a real
 * `dist/` rather than trusting the reasoning above.
 */
function devOnlyGallery() {
  return {
    name: 'dev-only-gallery',
    hooks: {
      /** @type {(options: { command: string; injectRoute: (route: { pattern: string; entrypoint: string; prerender?: boolean }) => void }) => void} */
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({
          pattern: '/dev/gallery',
          entrypoint: './src/dev/gallery.astro',
        });
      },
    },
  };
}

export default defineConfig({
  integrations: [react(), validateTaxData(), devOnlyGallery()],
  vite: {
    plugins: [tailwindcss()],
  },
});

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

export default defineConfig({
  integrations: [react(), validateTaxData()],
  vite: {
    plugins: [tailwindcss()],
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind is wired through @tailwindcss/vite, not @astrojs/tailwind. The latter
// peers on astro ^3||^4||^5 and tailwindcss ^3, so it supports neither Astro 7 nor
// Tailwind 4. See docs/prompts/P00-scaffold.md.
//
// `site` and `base` for GitHub Pages are deliberately not set here — P16 owns
// deployment configuration.
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});

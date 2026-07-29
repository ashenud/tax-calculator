// @ts-check
import { createHash } from 'node:crypto';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadTaxYears } from './src/lib/tax/load.ts';
import { THEME_INIT_SCRIPT } from './src/layouts/theme-init.ts';
import { BASE_PATH } from './src/lib/base-path.ts';

// Tailwind is wired through @tailwindcss/vite, not @astrojs/tailwind. The latter
// peers on astro ^3||^4||^5 and tailwindcss ^3, so it supports neither Astro 7 nor
// Tailwind 4. See docs/prompts/P00-scaffold.md.

/**
 * SHA-256 of the pre-paint theme script, base64, in the form CSP wants.
 *
 * Derived from the same constant `Base.astro` renders, so the two cannot drift.
 * A hash pasted in by hand would be correct exactly until someone edited the
 * script, and then would fail silently in a browser console nobody is reading.
 */
const THEME_INIT_SCRIPT_HASH = /** @type {`sha256-${string}`} */ (
  `sha256-${createHash('sha256').update(THEME_INIT_SCRIPT, 'utf8').digest('base64')}`
);

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
  // GITHUB PAGES, PROJECT PAGE. The repository is `ashenud/tax-calculator` and
  // there is no custom domain, so Pages serves the site from a sub-path. `site`
  // is the canonical origin; `base` is the sub-path every emitted URL is
  // prefixed with. Hand-written links do NOT get this treatment from Astro —
  // they go through `withBase()`, which reads the same constant this does.
  site: 'https://ashenud.github.io',
  base: BASE_PATH,

  security: {
    /**
     * CONTENT SECURITY POLICY — no external host, anywhere.
     *
     * `docs/spec/site-architecture.md` puts analytics, third-party scripts and
     * any server out of scope, and the calculator's whole posture is that
     * nothing a user types leaves their browser. That is currently a
     * convention held up by review. This policy makes it structural: a
     * third-party script, an embedded font CDN or an exfiltrating `fetch`
     * added in a later change stops working rather than shipping quietly.
     *
     * Astro emits the `<meta http-equiv="content-security-policy">` element
     * itself, filling `script-src` and `style-src` with the hashes of the
     * scripts and styles it bundled, and merging the directives below.
     *
     * On the individual directives:
     *
     * - `default-src 'none'` — deny by default; everything allowed is listed.
     * - `script-src` gets `'self'` plus Astro's own hashes automatically; the
     *   one hash added here is the pre-paint theme script, which is
     *   `is:inline` and therefore invisible to Astro's hashing.
     * - `style-src-attr 'unsafe-inline'` — Radix's select, radio-group and
     *   progress primitives position their hidden inputs and their indicator
     *   with a `style` attribute. A hash-based `style-src` blocks style
     *   *attributes*, so without this the calculator's controls render wrong.
     *   It permits no external host and no script; the alternative is
     *   forking three Radix primitives, which is worse.
     * - `img-src 'self'` — the favicon; there are no data: or remote images.
     * - `font-src 'self'` — `@fontsource-variable/inter` is self-hosted and
     *   Astro appends its own font resources to this directive.
     * - `connect-src 'none'` — the site never fetches at runtime. Rates are
     *   baked in at build time by design (site-architecture.md, "Principles").
     * - `form-action 'none'`, `base-uri 'none'`, `object-src 'none'` — no
     *   form posts anywhere, no `<base>` hijack, no plugins.
     *
     * `frame-ancestors` is deliberately absent: browsers ignore it in a
     * `<meta>` policy, and GitHub Pages sets no response headers we control,
     * so writing it here would only produce a console warning and a false
     * sense of coverage.
     */
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'none'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'none'",
        "form-action 'none'",
        "base-uri 'none'",
        "object-src 'none'",
        "manifest-src 'none'",
      ],
      scriptDirective: {
        hashes: [THEME_INIT_SCRIPT_HASH],
      },
      // `style-src-attr` cannot be written in `directives` — Astro rejects any
      // script-/style-src variant there and routes it through here instead.
      // `kind: 'attribute'` scopes it to `style-src-attr`, so the hash-based
      // `style-src` covering real stylesheets is left untouched.
      styleDirective: {
        resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },

  integrations: [react(), validateTaxData(), devOnlyGallery()],
  vite: {
    plugins: [tailwindcss()],
  },
});

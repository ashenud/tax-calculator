/**
 * Prefixing internal links with the deployment base path.
 *
 * WHY THIS EXISTS. The site is published as a GitHub Pages *project* page at
 * `https://ashenud.github.io/tax-calculator/`, so `astro.config.mjs` sets
 * `base: '/tax-calculator/'`. Astro rewrites the URLs of assets it emits
 * (`/_astro/*`, the favicon it copies, CSS and JS) but it does **not** rewrite
 * a link you wrote by hand: `href="/guides/"` in a `.astro` file ships exactly
 * as written and 404s once the site lives under a base path.
 *
 * P09's `CitationRef.tsx` flagged this explicitly ("When P16 sets a GitHub
 * Pages `base`, this default and `Base.astro`'s `NAV` need the same
 * treatment"), which is why the fix lands here rather than in a UI prompt.
 *
 * WHY A CONSTANT AND NOT `import.meta.env.BASE_URL`. Reading Vite's
 * `BASE_URL` is the idiomatic spelling and was the first implementation. It is
 * also poisonable: Vite merges `process.env` into `import.meta.env` for the
 * SSR pass that prerenders these pages, so an ambient `BASE_URL` environment
 * variable wins over the configured `base`. Vitest sets exactly that variable
 * (`BASE_URL=/`), and a build run from inside a test therefore emitted
 * `href="/guides/"` — unprefixed and 404-bound — while Astro's own asset URLs
 * stayed correctly prefixed. Half-right output, no error, no warning.
 *
 * Any CI runner that happened to export `BASE_URL` would have broken the
 * deployed site the same silent way. So the base path is a fact of the source,
 * declared once here; `astro.config.mjs` imports this same constant for its
 * `base` option, so the two cannot disagree.
 */

/** The path GitHub Pages serves this project from. Slash-terminated, per Astro. */
export const BASE_PATH = '/tax-calculator/';

/**
 * Prefix a root-relative site path with the deployment base path.
 *
 * Anything that is not root-relative — a fragment (`#main`), a relative path,
 * an absolute URL — is returned untouched. Prefixing those would corrupt them.
 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  // A protocol-relative URL (`//example.com`) is external despite the leading slash.
  if (path.startsWith('//')) return path;

  return `${BASE_PATH.slice(0, -1)}${path}`;
}

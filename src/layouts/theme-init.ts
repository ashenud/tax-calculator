/**
 * The pre-paint theme script, as a string, so it has exactly one definition.
 *
 * WHY A STRING AND NOT A `<script>` IN `Base.astro`. P16 turns on Astro's
 * `security.csp`, which emits a `script-src` built from hashes. Astro hashes
 * the scripts it processes and bundles; an `is:inline` script is by definition
 * *not* processed, so Astro cannot see it and cannot hash it. The alternatives
 * were `'unsafe-inline'` (which defeats the point of the policy, and which
 * browsers ignore anyway once a hash is present) or dropping the script (which
 * reintroduces the flash of the wrong theme that P01 added it to prevent).
 *
 * So the hash is supplied to the config explicitly — and to make sure it can
 * never drift from the script it is a hash *of*, `astro.config.mjs` imports
 * this same constant and hashes it at build time. One source of truth, hashed
 * mechanically. `src/layouts/csp.test.ts` re-derives the hash from the built
 * HTML and asserts it appears in that page's policy, so a divergence fails the
 * suite rather than only failing in a browser console.
 *
 * The script itself is unchanged from P01: it must run before first paint, or
 * a user who chose dark gets a white flash on every navigation.
 *
 * Keep in step with `ThemeToggle.astro` and the `:root[data-theme]` rules in
 * `global.css`.
 */
export const THEME_INIT_SCRIPT = `
try {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.dataset.theme = stored;
  }
} catch {
  /* Storage blocked (private mode, blocked cookies). prefers-color-scheme
     still applies, so the page themes itself correctly either way. */
}
`;

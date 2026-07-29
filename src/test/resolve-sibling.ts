/**
 * Resolves a path relative to a test file's own `import.meta.url`, for tests
 * that read their own source or a sibling file (e.g. parsing `ui.css` or a
 * component's `.tsx` source directly).
 *
 * A jsdom test file that also imports a React `.tsx` component has its whole
 * module graph transformed in Vite's client mode during Vitest's run phase.
 * That rewrites `import.meta.url` to a fake `http://localhost:3000/...`
 * dev-server URL for every module reached, including the test file itself and
 * anything it imports — `node:url`'s `fileURLToPath` then rejects it, since
 * it is not a `file:` URL. Real invocations never take the fallback branch:
 * this is specific to the jsdom + React combination in the test run phase.
 * Same problem, same fix, as `resolveDefaultTaxYearsDir` in
 * `src/lib/tax/load.ts`.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function resolveSibling(importMetaUrl: string, relative: string): string {
  const url = new URL(relative, importMetaUrl);
  if (url.protocol !== 'file:') {
    // `url.pathname` is still the correct repo-relative path on the fake
    // base — Vite's rewrite substitutes the dev-server origin but preserves
    // the relative traversal from this file's real location.
    return path.resolve(process.cwd(), url.pathname.replace(/^\//, ''));
  }
  return fileURLToPath(url);
}

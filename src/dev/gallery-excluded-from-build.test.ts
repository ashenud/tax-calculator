/**
 * The P08 component gallery must never reach `dist/`.
 *
 * astro.config.mjs's `devOnlyGallery()` integration only injects the `/dev/gallery`
 * route when `command === 'dev'`, so the reasoning is: no route, no entry point, no
 * build output. This test does not trust that reasoning — it runs a real production
 * build to a scratch directory and inspects the result, the same way
 * `node scripts/check-citations.mjs` and the schema-validation build hook are checked
 * by running them rather than by reading their source.
 *
 * Runs an actual `astro build`, so it is slower than the rest of the suite by design.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

function allFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allFiles(full));
    else out.push(full);
  }
  return out;
}

describe('the dev-only component gallery is excluded from the production build', () => {
  it('leaves no route, no page, and no JS chunk for /dev/gallery in dist/', () => {
    // Deliberately not named anything containing "gallery" — the outDir's own absolute
    // path would otherwise match the very regex this test uses to inspect its contents.
    const outDir = mkdtempSync(join(tmpdir(), 'p08-build-check-'));
    try {
      execFileSync('npx', ['astro', 'build', '--outDir', outDir], {
        cwd: repoRoot,
        stdio: 'pipe',
      });

      // Relative to outDir, not the absolute path: the scratch directory itself is
      // outside the build's control and must not be able to fail this assertion.
      const built = allFiles(outDir).map((path) => relative(outDir, path));
      expect(built.length).toBeGreaterThan(0); // the build actually produced something

      const galleryRelated = built.filter((path) =>
        /gallery|dev\/gallery|componentgallery/i.test(path),
      );
      expect(galleryRelated).toEqual([]);

      // Positive control: the real page the build IS supposed to produce is there,
      // so an empty `built` array (a build that silently failed) could not pass above.
      expect(built.some((path) => path.endsWith('index.html'))).toBe(true);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 60_000);
});

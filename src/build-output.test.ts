/**
 * P16's structural properties, asserted against a real production build.
 *
 * Three things this repository promises that can only be checked on the built
 * output, because they are properties of what a browser receives rather than of
 * any source file:
 *
 *   1. Every page carries a Content-Security-Policy naming no external host.
 *   2. Every inline script on a page is covered by a hash in that page's own
 *      policy — a policy that blocks the site's own scripts is worse than none,
 *      and the failure only shows up in a console nobody is watching.
 *   3. Guidance pages ship no JavaScript bundle: no island, no `_astro/*.js`,
 *      nothing but the ~1 KB theme pair.
 *
 * ON "ZERO JAVASCRIPT". `docs/spec/site-architecture.md` says guidance pages
 * "ship as static HTML with zero JavaScript", and P16's acceptance criteria
 * repeat it. As built, they are not literally zero: P01 deliberately ships a
 * pre-paint theme script and a sub-1 KB theme toggle, documented at length in
 * `Base.astro` and `ThemeToggle.astro`, both progressive enhancements that a
 * page works fine without (which is the guarantee site-architecture.md's
 * accessibility section actually states: "works without JavaScript for every
 * guidance page"). Removing them is a UI decision, not a deployment one, so
 * P16 does not make it. What this test enforces instead is the property the
 * "zero JavaScript" line exists to protect: no framework runtime, no island,
 * no bundle, and a hard byte budget on the two scripts that are there — so an
 * island added to a guidance page fails the suite rather than quietly costing
 * a phone user 45 KB.
 *
 * Runs an actual `astro build`, so it is slow by design. Same technique, and
 * the same scratch-directory reasoning, as
 * `src/dev/gallery-excluded-from-build.test.ts`.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/** Routes that must not ship a JavaScript bundle. Everything but the calculator. */
const GUIDANCE_PAGES = [
  'index.html',
  'guides/index.html',
  'guides/foreign-currency-income/index.html',
  'guides/employer-not-deducting/index.html',
  'guides/filing-your-return/index.html',
  'guides/deadlines/index.html',
  'guides/capital-gains/index.html',
  'rates/index.html',
  'rates/2025-26/index.html',
  'about/sources/index.html',
  'about/changelog/index.html',
] as const;

/**
 * The pre-paint theme script plus the compiled theme toggle. Both are inlined
 * by the bundler because they are tiny. If this budget starts failing, look at
 * what was added before raising it.
 */
const GUIDANCE_INLINE_JS_BUDGET_BYTES = 2048;

let outDir: string;
let builtFiles: string[];

function allFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allFiles(full));
    else out.push(full);
  }
  return out;
}

const html = (page: string): string =>
  readFileSync(join(outDir, ...page.split('/')), 'utf8');

/** `[attributes, body]` for every `<script>` element on the page. */
function scriptTags(source: string): { attrs: string; body: string }[] {
  return [...source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({
    attrs: m[1]!,
    body: m[2]!,
  }));
}

function cspOf(source: string): string {
  const match = source.match(
    /<meta\s+http-equiv="content-security-policy"\s+content="([^"]*)"/i,
  );
  if (!match) throw new Error('no Content-Security-Policy meta element on this page');
  return match[1]!;
}

function sha256(body: string): string {
  return `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
}

beforeAll(() => {
  // Under the repository, not os.tmpdir(): Astro's build renames its prerendered
  // assets out of `.astro/.prerender/`, and rename cannot cross a filesystem
  // boundary. See gallery-excluded-from-build.test.ts for the full story.
  const scratchRoot = join(repoRoot, 'node_modules', '.cache');
  mkdirSync(scratchRoot, { recursive: true });
  outDir = mkdtempSync(join(scratchRoot, 'p16-build-check-'));
  execFileSync('npx', ['astro', 'build', '--outDir', outDir], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
  builtFiles = allFiles(outDir).map((path) =>
    relative(outDir, path).split(sep).join('/'),
  );
  // The build actually produced something — otherwise every "absence"
  // assertion below would pass vacuously.
  expect(builtFiles.length).toBeGreaterThan(0);
}, 120_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe('every built page carries a Content-Security-Policy with no external host', () => {
  it('emits the meta element on all twelve routes', () => {
    const pages = builtFiles.filter((path) => path.endsWith('.html'));
    expect(pages.length).toBeGreaterThanOrEqual(12);
    for (const page of pages) {
      expect(() => cspOf(html(page)), `${page} has no CSP`).not.toThrow();
    }
  });

  it('names no scheme-bearing or host source anywhere in the policy', () => {
    for (const page of builtFiles.filter((p) => p.endsWith('.html'))) {
      const csp = cspOf(html(page));

      // A host source is anything that is not a quoted keyword and not a hash.
      // `https:`, `*`, `example.com`, `https://cdn.example.com` all match; the
      // directive names, `'self'`, `'none'`, `'unsafe-inline'` and the hashes
      // do not.
      const sources = csp
        .split(';')
        .map((directive) => directive.trim())
        .filter(Boolean)
        .flatMap((directive) => directive.split(/\s+/).slice(1));

      for (const source of sources) {
        expect(
          source.startsWith("'"),
          `${page}: CSP source ${source} is not a quoted keyword or hash`,
        ).toBe(true);
      }

      // Belt and braces, in the form someone reviewing a diff would recognise.
      expect(csp).not.toMatch(/https?:/);
      expect(csp).not.toMatch(/\*/);
      expect(csp).not.toMatch(/data:/);
      expect(csp).not.toMatch(/'unsafe-eval'/);

      // A `script-src` with `'unsafe-inline'` would silently undo the hashes.
      const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
      expect(scriptSrc).toBeDefined();
      expect(scriptSrc).not.toMatch(/'unsafe-inline'/);
      expect(scriptSrc).toMatch(/'sha256-/);

      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("connect-src 'none'");
    }
  });

  it('covers every inline script with a hash in that page’s own script-src', () => {
    for (const page of builtFiles.filter((p) => p.endsWith('.html'))) {
      const source = html(page);
      const csp = cspOf(source);
      const inline = scriptTags(source).filter((tag) => !/\ssrc=/.test(tag.attrs));
      expect(inline.length, `${page} has no inline script at all`).toBeGreaterThan(0);
      for (const tag of inline) {
        expect(
          csp,
          `${page}: inline script is not covered by a hash — the browser will block it`,
        ).toContain(sha256(tag.body));
      }
    }
  });

  it('references no external origin from any built HTML file', () => {
    // The CSP is the enforcement; this is the same claim checked directly, so
    // a policy accidentally relaxed later does not also hide a new third-party
    // request. `http-equiv` and the docs links in prose are not requests.
    for (const page of builtFiles.filter((p) => p.endsWith('.html'))) {
      const source = html(page);
      const requestUrls = [...source.matchAll(/(?:src|href)="(https?:\/\/[^"]*)"/g)].map(
        (m) => m[1]!,
      );
      expect(requestUrls, `${page} loads an external resource`).toEqual([]);
    }
  });
});

describe('guidance pages ship no JavaScript bundle', () => {
  it('covers every guidance route in the build', () => {
    for (const page of GUIDANCE_PAGES) {
      expect(builtFiles, `${page} was not built`).toContain(page);
    }
    // The calculator is the one page allowed a bundle; if it stopped being
    // built, the assertions below would be measuring nothing interesting.
    expect(builtFiles).toContain('calculator/index.html');
  });

  it('references no JavaScript asset — no island, no framework runtime', () => {
    for (const page of GUIDANCE_PAGES) {
      const source = html(page);
      expect(source, `${page} references a JS chunk`).not.toMatch(
        /_astro\/[A-Za-z0-9._-]+\.js/,
      );
      expect(source, `${page} hydrates an island`).not.toContain('<astro-island');
      expect(source, `${page} loads an external script`).not.toMatch(
        /<script[^>]+\ssrc=/,
      );
      expect(source, `${page} preloads a module`).not.toMatch(/rel="modulepreload"/);
      expect(source.toLowerCase(), `${page} ships React`).not.toContain('react-dom');
    }
  });

  it('keeps inline JavaScript to the two theme scripts, under budget', () => {
    for (const page of GUIDANCE_PAGES) {
      const inline = scriptTags(html(page)).filter((tag) => !/\ssrc=/.test(tag.attrs));

      // The pre-paint script from Base.astro and the compiled ThemeToggle.
      expect(inline, `${page} has an unexpected number of inline scripts`).toHaveLength(
        2,
      );
      expect(inline[0]!.body).toContain("localStorage.getItem('theme')");
      expect(inline[1]!.body).toContain('theme-toggle');

      const bytes = inline.reduce((total, tag) => total + Buffer.byteLength(tag.body), 0);
      expect(
        bytes,
        `${page} ships ${bytes} bytes of inline JS, over the ${GUIDANCE_INLINE_JS_BUDGET_BYTES}-byte budget`,
      ).toBeLessThanOrEqual(GUIDANCE_INLINE_JS_BUDGET_BYTES);
    }
  });

  it('still renders its content without that JavaScript', () => {
    // The point of the budget: the page is readable with scripting off. Each
    // guidance page's substance is server-rendered, so a marker from the layout
    // and the page's own heading are both in the HTML as shipped.
    for (const page of GUIDANCE_PAGES) {
      const source = html(page);
      expect(source, `${page} renders no <h1>`).toMatch(/<h1[\s>]/);
      expect(source, `${page} drops the ADR-0003 disclaimer`).toMatch(/disclaimer/i);
    }
  });
});

describe('the GitHub Pages base path is applied to hand-written links', () => {
  it('prefixes every root-relative link with /tax-calculator/', () => {
    for (const page of builtFiles.filter((p) => p.endsWith('.html'))) {
      const source = html(page);
      const rootRelative = [...source.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map(
        (m) => m[1]!,
      );
      expect(rootRelative.length, `${page} links nowhere`).toBeGreaterThan(0);
      for (const href of rootRelative) {
        expect(
          href.startsWith('/tax-calculator/'),
          `${page}: ${href} is not under the deployment base path and will 404`,
        ).toBe(true);
      }
    }
  });
});

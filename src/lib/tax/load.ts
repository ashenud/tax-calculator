/**
 * Loads and validates every tax-year data file at build time.
 *
 * This is deliberately the only place that reads `data/tax-years/` from disk. The
 * engine (P04+) and any page that needs tax data import `loadTaxYears`, never
 * `fs.readFileSync` a data file directly — so there is exactly one path a malformed
 * file can take to reach the site, and it is this one.
 *
 * Validation failure throws, rather than returning a Result-shaped value, on purpose:
 * this is called from an Astro integration hook (see `astro.config.mjs`) during
 * `astro build`, and an uncaught throw there is what actually fails the build. A
 * function that swallowed the error and returned `{ ok: false }` would only be
 * decoration — see docs/prompts/P02-tax-data-schema.md's acceptance criteria.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Extension-ful, like every other intra-repo import here. Vite and Astro resolve
// './schema' happily; bare `node scripts/validate-tax-data.mjs` does not, and P16
// runs this module under plain Node as its own CI step.
import { taxYearFileSchema, type TaxYearFile } from './schema.ts';

export interface LoadedTaxYear {
  /** Filename relative to the tax-years directory, e.g. "2025-26.json". */
  file: string;
  data: TaxYearFile;
}

/**
 * Default location of tax-year data files, resolved relative to this module's own
 * location rather than `process.cwd()` — so `loadTaxYears()` behaves the same
 * regardless of the directory the build happens to be invoked from.
 *
 * src/lib/tax/load.ts -> src/lib/tax -> src/lib -> src -> <repo root> -> data/tax-years
 *
 * Falls back to `process.cwd()` when `import.meta.url` is not a `file:` URL —
 * P09's component tests import this module from a `.tsx` test file, and once
 * a jsdom test's module graph includes a React component, Vitest transforms
 * the whole graph in client mode for the run phase, which rewrites every
 * module's `import.meta.url` to a fake `http://localhost:3000/...` dev-server
 * URL, this one included. Every real entry point — `astro build`, `astro dev`,
 * `vitest run` with no React in the graph — runs from the repo root, so the
 * fallback resolves to the same directory the `import.meta.url` path would
 * have.
 *
 * SECOND FALLBACK, ADDED IN P10. `src/pages/calculator/index.astro` calls this
 * from page frontmatter, which Astro **bundles** — so at build time this module
 * no longer lives at `src/lib/tax/`, it lives at
 * `<outDir>/.prerender/chunks/<hash>.mjs`. Three levels up from there is the
 * repository root only because `outDir` is `dist/`. Point `--outDir` anywhere
 * of a different depth and the derived path lands somewhere that does not
 * exist, and the build fails inside a page rather than anywhere near the cause.
 *
 * So the derived path is now a *candidate*, checked for existence, with
 * `<cwd>/data/tax-years` behind it. Behaviour is unchanged wherever the derived
 * path is right; where it is not, the loader finds the data instead of throwing
 * a directory-not-found from a bundled chunk.
 */
function resolveDefaultTaxYearsDir(): string {
  const relative = '../../../data/tax-years/';
  const url = new URL(relative, import.meta.url);
  const derived =
    url.protocol === 'file:'
      ? fileURLToPath(url)
      : // `url.pathname` is still the correct repo-relative path even on the
        // fake base — Vite's rewrite substitutes the dev-server origin but
        // preserves the relative traversal, so `../../../data/tax-years/` from
        // this file's real location still lands on `/data/tax-years/`.
        path.resolve(process.cwd(), url.pathname.replace(/^\//, ''));

  const candidates = [derived, path.resolve(process.cwd(), 'data/tax-years')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  // Neither exists: return the derived one so the error names the path the
  // module's own location implies, which is the more diagnosable of the two.
  return derived;
}

export const DEFAULT_TAX_YEARS_DIR = resolveDefaultTaxYearsDir();

function formatIssues(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => {
      const pathStr = issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)';
      return `  - ${pathStr}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Load and validate every `*.json` file in `dir` (default: `data/tax-years/`).
 *
 * Throws on the first invalid or unparsable file, with the filename and every
 * validation issue Zod found. Stops at the first bad file rather than collecting
 * errors across every file — a build should not attempt to reason about data that
 * has already failed validation.
 *
 * An empty directory (no `.json` files) is not an error: P02 ships the schema and
 * loader before any data file exists (P03 adds the first one), and the loader must
 * not require data it isn't yet this prompt's job to provide.
 */
export function loadTaxYears(dir: string = DEFAULT_TAX_YEARS_DIR): LoadedTaxYear[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (err) {
    throw new Error(
      `tax-year data directory not found or unreadable: ${dir}\n${String(err)}`,
      {
        cause: err,
      },
    );
  }

  const jsonFiles = entries.filter((name) => name.endsWith('.json')).sort();

  const results: LoadedTaxYear[] = [];
  for (const file of jsonFiles) {
    const fullPath = path.join(dir, file);
    const raw = readFileSync(fullPath, 'utf-8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`${file}: not valid JSON\n${String(err)}`, { cause: err });
    }

    const result = taxYearFileSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `${file}: failed tax-year schema validation, ${result.error.issues.length} issue(s):\n${formatIssues(result.error.issues)}`,
      );
    }

    results.push({ file, data: result.data });
  }

  return results;
}

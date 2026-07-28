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

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { taxYearFileSchema, type TaxYearFile } from './schema';

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
 */
export const DEFAULT_TAX_YEARS_DIR = fileURLToPath(
  new URL('../../../data/tax-years/', import.meta.url),
);

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

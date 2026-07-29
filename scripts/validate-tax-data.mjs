#!/usr/bin/env node
/**
 * Validates every file in data/tax-years/ against the Zod schema, standalone.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE BUILD. `astro.config.mjs` already runs
 * `loadTaxYears()` from an `astro:build:start` hook, so a malformed data file
 * fails `npm run build` — that is the guarantee P02 established and nothing
 * here weakens it. But in CI the build is the *last* and most expensive step,
 * and a data file that fails validation would be reported as "the build broke",
 * eight lines deep in a Vite stack trace, after typechecking and the whole
 * fixture suite have been paid for.
 *
 * P16's acceptance criteria require that "CI fails when a data file is
 * malformed" be independently verifiable. So this runs as its own labelled
 * step, before the fixture suite, and says plainly which file failed and why.
 *
 * It reads nothing itself: `src/lib/tax/load.ts` remains the only module that
 * touches `data/tax-years/` on disk, per its own docblock.
 *
 * Usage: node scripts/validate-tax-data.mjs
 * Exit codes: 0 all files valid; 1 a file is malformed, unreadable, or absent.
 */

import { loadTaxYears, DEFAULT_TAX_YEARS_DIR } from '../src/lib/tax/load.ts';

let loaded;
try {
  loaded = loadTaxYears();
} catch (err) {
  console.error('Tax-year data validation FAILED.\n');
  console.error(err instanceof Error ? err.message : String(err));
  console.error(
    '\nA data file that does not satisfy the schema must never reach a user.' +
      '\nSee docs/spec/data-model.md and src/lib/tax/schema.ts.',
  );
  process.exit(1);
}

// `loadTaxYears()` treats an empty directory as valid — deliberately, because
// P02 shipped the loader before P03 shipped the first data file. That is the
// right call for the loader and the wrong one for CI: from P03 onwards, zero
// data files means something deleted or misplaced them, and a site that builds
// with no rates at all is a worse failure than one that does not build.
if (loaded.length === 0) {
  console.error(`Tax-year data validation FAILED.\n`);
  console.error(`No *.json data files found in ${DEFAULT_TAX_YEARS_DIR}`);
  process.exit(1);
}

console.log(`Validating tax-year data in ${DEFAULT_TAX_YEARS_DIR}\n`);
for (const { file, data } of loaded) {
  const unverifiedNote = data.status === 'proposed' ? '  [proposed — not yet law]' : '';
  console.log(`  ok  ${file}  Y/A ${data.yearOfAssessment}${unverifiedNote}`);
}
console.log(
  `\n${loaded.length} tax-year file(s) valid against the schema in src/lib/tax/schema.ts.`,
);

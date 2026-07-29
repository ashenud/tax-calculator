/**
 * Nothing a person types leaves their browser.
 *
 * "Compute locally, keep nothing. No network call carries entered figures"
 * [`docs/spec/ui-behaviour.md`]. `src/pages/index.astro` and `Base.astro`'s
 * footer both promise this in so many words, and `docs/prompts/P10` lists it as
 * an acceptance criterion.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS CHECKS, AND WHAT IT DOES NOT
 * ---------------------------------------------------------------------------
 *
 * It reads every source file the calculator is built from and fails if any of
 * them so much as names an API that could send or persist a figure. That is a
 * **static** check: it proves the code contains no such call, which is the part
 * that can regress silently in a later edit. It is not a packet capture, and it
 * cannot be one in this environment.
 *
 * It is a stronger guarantee than it looks, because the calculator's whole data
 * path is synchronous and local — `computeTax` is pure, the tax-year data
 * arrives as a build-time prop, and there is no state outside React. There is
 * nowhere for a figure to go.
 *
 * Storage is included alongside the network APIs deliberately. A figure written
 * to `localStorage` has not been transmitted, but it has been *kept*, and on a
 * shared machine the next person to open the tool would find someone else's
 * income in it.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveSibling } from '../../test/resolve-sibling.ts';

/** Every API that could carry a figure off the page, or leave it behind. */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /\bfetch\s*\(/, why: 'fetch()' },
  { pattern: /\bXMLHttpRequest\b/, why: 'XMLHttpRequest' },
  { pattern: /\bnavigator\s*\.\s*sendBeacon\b/, why: 'navigator.sendBeacon' },
  { pattern: /\bnew\s+WebSocket\b/, why: 'WebSocket' },
  { pattern: /\bnew\s+EventSource\b/, why: 'EventSource' },
  { pattern: /\bimport\s*\(/, why: 'a dynamic import, which is a network fetch' },
  { pattern: /\blocalStorage\b/, why: 'localStorage' },
  { pattern: /\bsessionStorage\b/, why: 'sessionStorage' },
  { pattern: /\bindexedDB\b/, why: 'indexedDB' },
  { pattern: /\bdocument\s*\.\s*cookie\b/, why: 'document.cookie' },
  { pattern: /\bnavigator\s*\.\s*clipboard\b/, why: 'the clipboard' },
  { pattern: /\.\s*submit\s*\(\)/, why: 'a form submission' },
  { pattern: /<form\b/i, why: 'a <form> element, which can be submitted' },
];

const CALCULATOR_DIR = resolveSibling(import.meta.url, '.');
const PAGE = resolveSibling(import.meta.url, '../../pages/calculator/index.astro');

function sourcesUnderTest(): { file: string; source: string }[] {
  const files = readdirSync(CALCULATOR_DIR)
    .filter((name) => /\.(ts|tsx|css)$/.test(name))
    // Test files and the test driver are not shipped; they also legitimately
    // mention things like `fireEvent`. Only shipped source is scanned.
    .filter((name) => !name.includes('.test.') && name !== 'test-driver.tsx')
    .map((name) => path.join(CALCULATOR_DIR, name));

  files.push(PAGE);

  return files.map((file) => ({ file, source: readFileSync(file, 'utf8') }));
}

/** Comments say words like "fetch" on purpose; code is what is being checked. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('no figure a user enters can leave the browser', () => {
  const sources = sourcesUnderTest();

  it('has source files to scan at all', () => {
    // A scan over nothing passes vacuously, which would be the worst outcome
    // here: a guarantee that quietly stopped being checked.
    expect(sources.length).toBeGreaterThan(5);
    expect(sources.map((s) => path.basename(s.file))).toContain('TaxCalculator.tsx');
    expect(sources.map((s) => path.basename(s.file))).toContain('index.astro');
  });

  for (const { pattern, why } of FORBIDDEN) {
    it(`never uses ${why}`, () => {
      for (const { file, source } of sources) {
        expect(
          stripComments(source),
          `${path.basename(file)} uses ${why}; entered figures must never leave the browser or be kept`,
        ).not.toMatch(pattern);
      }
    });
  }

  it('the engine it calls is pure too — no I/O, no clock, no globals', () => {
    // Restated from the engine's own suite, because the claim this file makes
    // is about the whole path a figure takes, and the engine is the rest of it.
    const engine = readFileSync(
      resolveSibling(import.meta.url, '../../lib/tax/engine.ts'),
      'utf8',
    );
    const code = stripComments(engine);
    expect(code).not.toMatch(/\bfetch\s*\(/);
    expect(code).not.toMatch(/\bnew Date\b/);
    expect(code).not.toMatch(/\bDate\.now\b/);
    expect(code).not.toMatch(/require\(|from ['"]node:/);
  });
});

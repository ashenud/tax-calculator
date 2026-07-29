/**
 * `withBase()` is what stands between a hand-written link and a 404 on the
 * deployed site, so its edge cases are worth pinning down.
 */

import { describe, expect, it } from 'vitest';
import { BASE_PATH, withBase } from './base-path.ts';

describe('BASE_PATH', () => {
  it('is slash-terminated, as Astro requires of `base`', () => {
    expect(BASE_PATH.startsWith('/')).toBe(true);
    expect(BASE_PATH.endsWith('/')).toBe(true);
  });

  it('is the GitHub Pages project path for this repository', () => {
    // Not a style assertion: this string is the difference between a working
    // site and one where every link 404s. Changing it should be deliberate,
    // which means changing this line too.
    expect(BASE_PATH).toBe('/tax-calculator/');
  });
});

describe('withBase', () => {
  it('prefixes a root-relative path without doubling the slash', () => {
    expect(withBase('/guides/')).toBe('/tax-calculator/guides/');
    expect(withBase('/')).toBe('/tax-calculator/');
    expect(withBase('/favicon.svg')).toBe('/tax-calculator/favicon.svg');
  });

  it('keeps a query string and a fragment attached to the path', () => {
    expect(withBase('/rates/2025-26/#relief')).toBe(
      '/tax-calculator/rates/2025-26/#relief',
    );
  });

  it('leaves a bare fragment alone — it addresses the current document', () => {
    expect(withBase('#main')).toBe('#main');
    expect(withBase('#calc-step-result')).toBe('#calc-step-result');
  });

  it('leaves an absolute URL alone', () => {
    expect(withBase('https://www.ird.gov.lk/')).toBe('https://www.ird.gov.lk/');
    expect(withBase('mailto:someone@example.com')).toBe('mailto:someone@example.com');
  });

  it('leaves a protocol-relative URL alone, despite the leading slash', () => {
    expect(withBase('//cdn.example.com/x.js')).toBe('//cdn.example.com/x.js');
  });

  it('leaves a relative path alone', () => {
    expect(withBase('sources/')).toBe('sources/');
    expect(withBase('../rates/')).toBe('../rates/');
  });

  it('is not idempotent, and is not meant to be applied twice', () => {
    // Documenting the sharp edge rather than papering over it: a "did I already
    // prefix this?" check would make double-prefixing invisible instead of
    // visible, and the built-output test catches the visible version.
    expect(withBase(withBase('/guides/'))).toBe('/tax-calculator/tax-calculator/guides/');
  });
});

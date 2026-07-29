/**
 * @vitest-environment jsdom
 *
 * `CitationRef` and the two badges: the markers that make a figure checkable.
 *
 * The `sources` maps used here come from the real `data/tax-years/` file, so a
 * change to the shape of a `src` pointer fails this suite rather than quietly
 * producing a citation that links nowhere.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CitationRef, splitSrc } from './CitationRef.tsx';
import { NotYetLawBadge, UnverifiedBadge } from './UnverifiedBadge.tsx';
import { loadTaxYears } from '../../lib/tax/load.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const taxYear = loadTaxYears()[0]!.data;
const sources = taxYear.sources;
/** A real pointer out of the data: `"act-2-2025#s.3(1)(d) — IRA Sch.1 …"`. */
const realSrc = Object.values(taxYear.conditions)[0]!.src;

describe('splitSrc', () => {
  it('splits a pointer into its source key and its pinpoint', () => {
    expect(splitSrc('act-2-2025#s.3(1)(d)')).toEqual({
      key: 'act-2-2025',
      pinpoint: 's.3(1)(d)',
    });
  });

  it('treats a pointer with no hash as a whole-document reference', () => {
    expect(splitSrc('ira-2017')).toEqual({ key: 'ira-2017', pinpoint: null });
  });

  it('resolves every src in the real data file to a key in its sources map', () => {
    const seen: string[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node !== null && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === 'src' && typeof value === 'string') seen.push(value);
          walk(value);
        }
      }
    };
    walk(taxYear);

    expect(seen.length).toBeGreaterThan(0);
    for (const src of seen) expect(sources[splitSrc(src).key]).toBeDefined();
  });
});

describe('CitationRef', () => {
  it('renders the document title and the pinpoint as visible text', () => {
    const { container } = render(<CitationRef src={realSrc} sources={sources} />);
    const { key, pinpoint } = splitSrc(realSrc);
    expect(container.textContent).toContain(sources[key]!.title);
    expect(container.textContent).toContain(pinpoint!);
  });

  it('links to the sources page, anchored on the source key', () => {
    render(<CitationRef src={realSrc} sources={sources} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(`/about/sources/#${splitSrc(realSrc).key}`);
  });

  it('is never a tooltip — no title attribute carrying the reference', () => {
    const { container } = render(<CitationRef src={realSrc} sources={sources} />);
    expect(container.querySelector('[title]')).toBeNull();
    expect(container.querySelector('[data-tooltip]')).toBeNull();
    // Reachable on touch: the reference is text, and the link is a real anchor.
    expect(screen.getByRole('link').textContent).not.toBe('');
  });

  it('still renders the pointer when the key does not resolve', () => {
    const { container } = render(
      <CitationRef src="an-act-nobody-registered#s.1" sources={sources} />,
    );
    // Visible, and visibly unresolved. Never dropped, and never linked to an
    // anchor that is not on the sources page.
    expect(container.textContent).toContain('an-act-nobody-registered');
    expect(container.textContent).toContain('s.1');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders without a sources map, on the raw key', () => {
    const { container } = render(<CitationRef src="ira-2017#s.85(1)(a)" />);
    expect(container.textContent).toContain('ira-2017');
    expect(container.textContent).toContain('s.85(1)(a)');
  });

  it('takes a visible label when one is wanted', () => {
    const { container } = render(
      <CitationRef src={realSrc} sources={sources} label="Condition from" />,
    );
    expect(container.textContent).toContain('Condition from');
  });
});

describe('UnverifiedBadge', () => {
  it('says what it means in words, not only in colour', () => {
    const { container } = render(<UnverifiedBadge />);
    expect(container.textContent).toContain('Not yet confirmed against primary law');
  });

  it('names the figure it sits on when told', () => {
    const { container } = render(<UnverifiedBadge what="the capital gains rate" />);
    expect(container.textContent).toContain('the capital gains rate');
  });

  it('carries an icon alongside the words', () => {
    const { container } = render(<UnverifiedBadge />);
    const icon = container.querySelector('.ui-badge__icon');
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
  });

  it('is not a tooltip and is not dismissible', () => {
    const { container } = render(<UnverifiedBadge what="a rate" />);
    expect(container.querySelector('[title]')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('NotYetLawBadge', () => {
  it('says "Not yet law" in words', () => {
    const { container } = render(<NotYetLawBadge yearOfAssessment="2026/2027" />);
    expect(container.textContent).toContain('Not yet law');
  });

  it('names the year of assessment it is said about', () => {
    const { container } = render(<NotYetLawBadge yearOfAssessment="2026/2027" />);
    expect(container.textContent).toContain('2026/2027');
  });
});

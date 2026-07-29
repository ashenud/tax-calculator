/**
 * @vitest-environment jsdom
 *
 * P12's own acceptance checks: the DOM order refusals → warnings → figure →
 * working → schedule → next-steps, that a refusal renders none of the last
 * three, that every displayed rate carries a citation, and that the mobile
 * summary bar's blocking indicator only appears when a blocking warning does.
 *
 * ORDER IS ASSERTED AS DOCUMENT ORDER, NOT AS APPEARANCE — the same technique
 * `RefusalPanel.test.tsx` uses. jsdom applies no stylesheet at all, so every
 * `compareDocumentPosition` assertion below is "verified with CSS disabled" in
 * the strongest sense available here; the second half of this file closes the
 * gap the same way that test does, by reading `calculator.css` itself for an
 * `order` property that could reorder things in a real browser.
 *
 * Fixtures are real `TaxResult`s from `computeTax()` over real (or, for the
 * blocking-warning case, a schema-valid mutated copy of the real) tax-year
 * data — never a hand-written `TaxResult` — for the same reason
 * `RefusalPanel.test.tsx` gives: a hand-written object could drift from what
 * the engine actually produces without this suite ever noticing.
 */

import { readFileSync } from 'node:fs';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ResultStep } from './ResultStep.tsx';
import type { Computation } from './compute.ts';
import { formatRupeesWithUnit } from '../ui/currency.ts';
import { computeTax, isRefusal, type TaxResult } from '../../lib/tax/engine.ts';
import { loadTaxYears } from '../../lib/tax/load.ts';
import { taxYearFileSchema, type TaxYearFile } from '../../lib/tax/schema.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';
import { resolveSibling } from '../../test/resolve-sibling.ts';

installDomPolyfills();
afterEach(cleanup);

const TAX_YEAR: TaxYearFile = loadTaxYears()[0]!.data;

/** A plain computed result: one employment source, nothing exotic. */
function computedResult(): TaxResult {
  const result = computeTax(
    {
      residency: 'resident',
      income: { employment: [{ label: 'Salary', amount: 5_000_000 }] },
    },
    TAX_YEAR,
  );
  if (isRefusal(result)) throw new Error('fixture unexpectedly refused');
  return result;
}

/** The same result, but with an estimate on file so the schedule is populated. */
function computedResultWithSchedule(): TaxResult {
  const result = computeTax(
    {
      residency: 'resident',
      income: { employment: [{ label: 'Salary', amount: 5_000_000 }] },
      estimatedTaxForInstalments: 400_000,
    },
    TAX_YEAR,
  );
  if (isRefusal(result)) throw new Error('fixture unexpectedly refused');
  if (result.schedule.instalments.length === 0) {
    throw new Error('fixture no longer produces a schedule');
  }
  return result;
}

/** Q14: capped and uncapped foreign income on the same ladder — the engine's
 * one refusal. Same fixture `RefusalPanel.test.tsx` and the gallery use. */
function refusedResult(): TaxResult {
  const result = computeTax(
    {
      residency: 'resident',
      income: {
        employment: [{ label: 'Salary', amount: 2_000_000 }],
        business: [
          {
            label: 'Overseas clients, paid into my bank here',
            amount: 3_000_000,
            tags: ['foreign-capped'],
            conditions: { 'remitted-through-bank-to-sri-lanka': true },
          },
          {
            label: 'Overseas clients, left abroad',
            amount: 500_000,
            tags: ['foreign-capped'],
            conditions: { 'remitted-through-bank-to-sri-lanka': false },
          },
        ],
      },
    },
    TAX_YEAR,
  );
  if (!isRefusal(result)) throw new Error('fixture no longer produces a refusal');
  return result;
}

/**
 * A schema-valid copy of the real data with `capital-gain` removed from
 * `separatelyRated`, so a capital gain has nowhere to be rated. Same technique
 * `conditions-from-data.test.tsx` uses for its own fixture: a real data file,
 * mutated and re-parsed through the actual schema, never a hand-built object.
 */
function taxYearMissingCapitalGainRate(): TaxYearFile {
  const rest = Object.fromEntries(
    Object.entries(TAX_YEAR.separatelyRated).filter(([kind]) => kind !== 'capital-gain'),
  );
  return taxYearFileSchema.parse({ ...TAX_YEAR, separatelyRated: rest });
}

/** A blocking warning (`component-not-implemented`), so the mobile summary
 * bar's indicator has something real to react to. */
function computedResultWithBlockingWarning(): TaxResult {
  const taxYear = taxYearMissingCapitalGainRate();
  const result = computeTax(
    {
      residency: 'resident',
      income: {
        investment: [
          { label: 'Sale of land', amount: 1_000_000, tags: ['capital-gain'] },
        ],
      },
    },
    taxYear,
  );
  if (isRefusal(result)) throw new Error('fixture unexpectedly refused');
  if (!result.warnings.some((w) => w.severity === 'blocking')) {
    throw new Error('fixture no longer produces a blocking warning');
  }
  return result;
}

function computedComputation(result: TaxResult): Computation {
  return { status: 'computed', result };
}

/** `a` comes before `b` in the document. Tree order; no layout involved. */
function precedes(a: Element | null, b: Element | null): boolean {
  if (!a || !b) return false;
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/* ========================================================================= */

describe('the six-part order is DOM order, with CSS disabled', () => {
  it('refusals, warnings, figure, working, schedule, next-steps — in that order', () => {
    // The refusal fixture also carries a warning (the unmet condition on the
    // second business item), so all six sections are on the page at once.
    const result = refusedResult();
    if (result.warnings.length === 0) {
      throw new Error('fixture no longer produces warnings alongside the refusal');
    }

    const { container } = render(
      <ResultStep computation={computedComputation(result)} taxYear={TAX_YEAR} />,
    );

    const refusal = container.querySelector('.ui-refusal');
    const warnings = container.querySelector('.ui-warning-list');
    expect(refusal, 'no refusal rendered').not.toBeNull();
    expect(warnings, 'no warning list rendered').not.toBeNull();
    expect(precedes(refusal, warnings)).toBe(true);

    // Nothing past the refusal exists at all — asserted properly below — so
    // there is nothing further to order here. The non-refused case is what
    // proves figure < working < schedule < next-steps.
  });

  it('figure, working, schedule, next-steps — in that order, on a real figure', () => {
    const { container } = render(
      <ResultStep
        computation={computedComputation(computedResultWithSchedule())}
        taxYear={TAX_YEAR}
      />,
    );

    const figure = container.querySelector('.calc-figure');
    const working = container.querySelector('#calc-working');
    const schedule = container.querySelector('#calc-schedule');
    const whatNext = container.querySelector('#calc-what-next');

    expect(figure, 'no figure rendered').not.toBeNull();
    expect(working, 'no working table rendered').not.toBeNull();
    expect(schedule, 'no payment schedule rendered').not.toBeNull();
    expect(whatNext, 'no what-next section rendered').not.toBeNull();

    expect(precedes(figure, working)).toBe(true);
    expect(precedes(working, schedule)).toBe(true);
    expect(precedes(schedule, whatNext)).toBe(true);
  });

  it('warnings still precede the figure when there is no refusal', () => {
    const result = computedResultWithBlockingWarning();
    expect(result.warnings.length).toBeGreaterThan(0);

    const taxYear = taxYearMissingCapitalGainRate();
    const { container } = render(
      <ResultStep computation={computedComputation(result)} taxYear={taxYear} />,
    );

    const warnings = container.querySelector('.ui-warning-list');
    const figure = container.querySelector('.calc-figure');
    expect(precedes(warnings, figure)).toBe(true);
  });
});

describe('a refusal renders no figure, no working, no schedule, and no next-steps', () => {
  it.each([
    ['.calc-figure', 'the figure'],
    ['#calc-working', 'the working table'],
    ['#calc-schedule', 'the payment schedule'],
    ['#calc-what-next', 'the next-steps section'],
  ])('%s (%s) is absent', (selector) => {
    const { container } = render(
      <ResultStep
        computation={computedComputation(refusedResult())}
        taxYear={TAX_YEAR}
      />,
    );
    expect(container.querySelector(selector)).toBeNull();
  });

  it('never renders "Rs." anywhere on the page', () => {
    const { container } = render(
      <ResultStep
        computation={computedComputation(refusedResult())}
        taxYear={TAX_YEAR}
      />,
    );
    expect(container.textContent).not.toMatch(/Rs\.\s*[\d,]/);
  });
});

/* ========================================================================= */

describe('every displayed rate has a citation', () => {
  it('one CitationRef per band shown in the working table, and every one resolves', () => {
    const result = computedResultWithSchedule();
    const { container } = render(
      <ResultStep computation={computedComputation(result)} taxYear={TAX_YEAR} />,
    );

    const bandCount = result.components.reduce((sum, c) => sum + c.bands.length, 0);
    const working = container.querySelector('#calc-working') as HTMLElement;
    const citations = within(working).getAllByText((_, el) =>
      Boolean(el?.classList.contains('ui-citation')),
    );

    // At least one citation per band; the working table may carry additional
    // ones (the sources-used list), so this is a floor, not an exact count —
    // the exact count would break the moment that list's own dedup changes.
    expect(citations.length).toBeGreaterThanOrEqual(bandCount);

    for (const citation of citations) {
      expect(
        citation.getAttribute('data-resolved'),
        `citation "${citation.textContent}" did not resolve against taxYear.sources`,
      ).toBe('');
    }
  });
});

/* ========================================================================= */

describe('the mobile summary bar', () => {
  it('shows nothing worked out yet, and no blocking indicator, when incomplete', () => {
    render(
      <ResultStep
        computation={{
          status: 'incomplete',
          missing: [{ key: 'income', what: 'an income figure' }],
        }}
        taxYear={TAX_YEAR}
      />,
    );
    expect(screen.getByText('Nothing worked out yet')).not.toBeNull();
    expect(screen.queryByText(/Do not rely on the figure/)).toBeNull();
  });

  it('shows the figure, and no blocking indicator, on an ordinary result', () => {
    render(
      <ResultStep
        computation={computedComputation(computedResult())}
        taxYear={TAX_YEAR}
      />,
    );
    const bar = document.querySelector('.calc-summary-bar') as HTMLElement;
    expect(within(bar).getByText(/^Rs\. [\d,]+$/)).not.toBeNull();
    expect(within(bar).queryByText(/Do not rely on the figure/)).toBeNull();
  });

  it('shows the blocking indicator when the result carries a blocking warning', () => {
    const result = computedResultWithBlockingWarning();
    const taxYear = taxYearMissingCapitalGainRate();
    render(<ResultStep computation={computedComputation(result)} taxYear={taxYear} />);
    const bar = document.querySelector('.calc-summary-bar') as HTMLElement;
    expect(within(bar).getByText(/Do not rely on the figure/)).not.toBeNull();
  });

  it('shows "no figure" and the blocking indicator on a refusal', () => {
    render(
      <ResultStep
        computation={computedComputation(refusedResult())}
        taxYear={TAX_YEAR}
      />,
    );
    const bar = document.querySelector('.calc-summary-bar') as HTMLElement;
    expect(within(bar).getByText(/No figure/)).not.toBeNull();
    expect(within(bar).getByText(/Do not rely on the figure/)).not.toBeNull();
  });
});

/* ========================================================================= */

describe('nothing here computes a value', () => {
  it('the schedule state says words, never a table with a zero row, when no estimate was given', () => {
    render(
      <ResultStep
        computation={computedComputation(computedResult())}
        taxYear={TAX_YEAR}
      />,
    );
    expect(
      screen.getByText(/no estimate of tax payable for this year was given/),
    ).not.toBeNull();
  });

  it('the figure text is exactly formatRupeesWithUnit(taxPayable) — nothing added to it', () => {
    const result = computedResultWithSchedule();
    const { container } = render(
      <ResultStep computation={computedComputation(result)} taxYear={TAX_YEAR} />,
    );
    const figure = container.querySelector('.calc-figure');
    expect(figure?.textContent).toBe(formatRupeesWithUnit(result.taxPayable));
  });
});

/* ========================================================================= */

describe('the figure never animates, and nothing added here would make it', () => {
  it('calculator.css declares no transition or animation property', () => {
    const css = readFileSync(
      resolveSibling(import.meta.url, './calculator.css'),
      'utf-8',
    );
    expect(css).not.toMatch(/\btransition\s*:/);
    expect(css).not.toMatch(/\banimation\s*:/);
  });

  it('neither the result region nor the working section reorders via CSS `order`', () => {
    const css = readFileSync(
      resolveSibling(import.meta.url, './calculator.css'),
      'utf-8',
    );
    expect(css).not.toMatch(/\border\s*:/);
  });
});

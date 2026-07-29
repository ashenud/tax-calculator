/**
 * @vitest-environment jsdom
 *
 * The ADR-0003 invariants that cannot be checked by reading the code.
 *
 * These run against a **real** `TaxResult` from `computeTax()` over the real
 * `data/tax-years/` file, not a hand-written object. A hand-written refusal
 * would let this suite pass while the engine's actual refusal shape had drifted
 * away from it, which is the failure the whole arrangement exists to catch.
 *
 * ORDER IS ASSERTED AS DOCUMENT ORDER, NOT AS APPEARANCE. jsdom applies no
 * stylesheet at all — `ui.css` is never loaded here — so every position assertion
 * below is exactly the "with CSS disabled" check the prompt asks for. They use
 * `compareDocumentPosition`, which reads the tree, not the layout.
 */

import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RefusalPanel, type ComputedTaxResult } from './RefusalPanel.tsx';
import { formatRupeesWithUnit } from './currency.ts';
import { computeTax, isRefusal, type TaxResult } from '../../lib/tax/engine.ts';
import { loadTaxYears } from '../../lib/tax/load.ts';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';
import { resolveSibling } from '../../test/resolve-sibling.ts';

installDomPolyfills();
afterEach(cleanup);

const taxYear = loadTaxYears()[0]!.data;

/**
 * The engine's one refusal: capped and uncapped income on the same ladder, so
 * neither ordering can be chosen without guessing (Q14). The third item fails
 * the cap's condition, which also raises a warning — so this result exercises
 * refusals **and** warnings together, which is where the page order matters.
 */
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
    taxYear,
  );
  // The fixture is only useful if it really is a refusal.
  if (!isRefusal(result)) throw new Error('fixture no longer produces a refusal');
  if (result.warnings.length === 0) {
    throw new Error('fixture no longer produces warnings alongside the refusal');
  }
  return result;
}

/** A computed result that carries warnings, so order can be checked. */
function computedWithWarnings(): TaxResult {
  const result = computeTax(
    {
      residency: 'resident',
      income: {
        employment: [{ label: 'Salary', amount: 5_000_000 }],
        investment: [
          { label: 'Sale of land', amount: 1_000_000, tags: ['capital-gain'] },
        ],
      },
      creditsPaid: { apit: 900_000 },
      estimatedTaxForInstalments: 400_000,
    },
    taxYear,
  );
  if (isRefusal(result)) throw new Error('fixture unexpectedly refused');
  if (result.warnings.length === 0) throw new Error('fixture produced no warnings');
  return result;
}

const FIGURE_TEST_ID = 'the-figure';

/** Stands in for P10's result panel. Requires a `ComputedTaxResult`, exactly as
 * that panel will — which is the point of the brand. */
function Figure({ result }: { result: ComputedTaxResult }) {
  return (
    <p data-testid={FIGURE_TEST_ID} className="figure">
      Tax payable {formatRupeesWithUnit(result.taxPayable)}
    </p>
  );
}

/** `a` comes before `b` in the document. Tree order; no layout involved. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('a refusal renders no figure anywhere', () => {
  it('never calls the children callback, so the figure is never even built', () => {
    const renderFigure = vi.fn((result: ComputedTaxResult) => <Figure result={result} />);
    render(<RefusalPanel result={refusedResult()}>{renderFigure}</RefusalPanel>);

    expect(renderFigure).not.toHaveBeenCalled();
    expect(screen.queryByTestId(FIGURE_TEST_ID)).toBeNull();
  });

  it('puts no rupee amount and no figure-styled element on the page', () => {
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );

    const text = container.textContent ?? '';

    // No formatted money: no "Rs." unit and no comma-grouped amount. Both are
    // how a rupee figure is displayed anywhere on this site (`currency.ts`).
    expect(text).not.toContain('Rs.');
    expect(text).not.toMatch(/\d{1,3}(?:,\d{3})+/);
    // The zeroed placeholders on `TaxResult` must not surface as "nothing owed".
    expect(text).not.toMatch(/\bRs\.?\s*0\b/);
    // Nothing on the page is marked up as a figure.
    expect(container.querySelector('.figure')).toBeNull();

    // Deliberately NOT asserted: that no digit at all appears. The engine's
    // explanation restates the income amounts the *user entered*, which is what
    // a practitioner picking this up needs. Those are the user's own inputs,
    // never a computed liability, and they are the only digits present.
    expect(text).toMatch(/no figure has been computed/i);
  });

  it('states the year of assessment even though there is no figure', () => {
    const result = refusedResult();
    const { container } = render(
      <RefusalPanel result={result}>{(r) => <Figure result={r} />}</RefusalPanel>,
    );
    expect(container.textContent).toContain(result.yearOfAssessment);
  });

  it('is announced as an alert', () => {
    render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/not going to guess at your tax/i);
  });

  it('names the open question, so the refusal is not a dead end', () => {
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );
    expect(container.textContent).toContain('Q14');
    expect(container.textContent).toMatch(/qualified tax practitioner/i);
  });

  it('does not collapse the refusal behind a disclosure', () => {
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );
    expect(container.querySelector('details')).toBeNull();
    expect(container.querySelector('summary')).toBeNull();
    expect(container.querySelector('[hidden]')).toBeNull();
  });
});

describe('the normative page order, in the DOM', () => {
  it('renders warnings before the figure', () => {
    const result = computedWithWarnings();
    const { container } = render(
      <RefusalPanel result={result}>{(r) => <Figure result={r} />}</RefusalPanel>,
    );

    const warnings = container.querySelector('.ui-warning-list');
    const figure = screen.getByTestId(FIGURE_TEST_ID);
    expect(warnings).not.toBeNull();
    expect(precedes(warnings!, figure)).toBe(true);
  });

  it('renders every individual warning before the figure, not just the first', () => {
    const result = computedWithWarnings();
    const { container } = render(
      <RefusalPanel result={result}>{(r) => <Figure result={r} />}</RefusalPanel>,
    );

    const figure = screen.getByTestId(FIGURE_TEST_ID);
    const items = [...container.querySelectorAll('.ui-warning-list .ui-callout')];
    expect(items.length).toBe(result.warnings.length);
    for (const item of items) expect(precedes(item, figure)).toBe(true);
  });

  it('renders refusals before warnings — order 1 then 2 in ui-behaviour.md §4', () => {
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );

    const refusal = container.querySelector('.ui-refusal');
    const warnings = container.querySelector('.ui-warning-list');
    expect(refusal).not.toBeNull();
    expect(warnings).not.toBeNull();
    expect(precedes(refusal!, warnings!)).toBe(true);
  });

  it('uses no CSS property capable of reordering the region', () => {
    // The assertions above hold in jsdom, where no stylesheet is applied. This
    // one closes the other half: that the shipped stylesheet cannot move a
    // warning below a figure in a real browser either.
    const css = readUiCss();
    const region = /\.ui-result-region\b[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(region).not.toMatch(/order\s*:/);
    expect(region).not.toMatch(/column-reverse|row-reverse|wrap-reverse/);
    expect(region).not.toMatch(/grid-area|grid-template/);
  });
});

describe('the result is announced politely', () => {
  it('wraps the figure in an aria-live="polite" region', () => {
    const { container } = render(
      <RefusalPanel result={computedWithWarnings()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );

    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live!.contains(screen.getByTestId(FIGURE_TEST_ID))).toBe(true);
  });

  it('keeps the live region in the DOM on a refusal, empty', () => {
    // It must exist before it has anything to say; a region created at the
    // moment its content arrives is a region nothing is announced from.
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live!.textContent).toBe('');
  });

  it('does not make the refusal itself a polite region — it is an alert', () => {
    const { container } = render(
      <RefusalPanel result={refusedResult()}>
        {(result) => <Figure result={result} />}
      </RefusalPanel>,
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert!.closest('[aria-live="polite"]')).toBeNull();
  });
});

describe('a computed result renders its figure', () => {
  it('calls children with the result and shows the figure', () => {
    const result = computedWithWarnings();
    render(<RefusalPanel result={result}>{(r) => <Figure result={r} />}</RefusalPanel>);

    expect(screen.getByTestId(FIGURE_TEST_ID).textContent).toContain(
      formatRupeesWithUnit(result.taxPayable),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

// ---------------------------------------------------------------------------

function readUiCss(): string {
  return readFileSync(resolveSibling(import.meta.url, './ui.css'), 'utf8');
}

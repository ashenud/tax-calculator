/**
 * "The result shows its working. Every pipeline step and every rate applied,
 * with citations" [ADR-0003 decision 7].
 *
 * ---------------------------------------------------------------------------
 * NOTHING HERE COMPUTES ANYTHING
 * ---------------------------------------------------------------------------
 *
 * Every number in every table is a field read straight off the `TaxResult`
 * this component is handed — `result.assessableByHead`, `result.partition`,
 * `result.components[i].bands[j].tax`, and so on. There is no `+`, no `-` and
 * no `*` on a rupee value anywhere in this file. A subtotal computed here would
 * be a subtotal no fixture covers [`docs/spec/calculation-engine.md`].
 *
 * ---------------------------------------------------------------------------
 * WHY A REAL `<table>`, THREE TIMES OVER
 * ---------------------------------------------------------------------------
 *
 * "The working table is a real `<table>` with scoped headers, not a grid of
 * divs" [`docs/spec/ui-behaviour.md`, Keyboard and screen reader]. `Table`
 * (P08) already gives tabular numerals, a caption, an empty state in words and
 * a keyboard-reachable scroll region; this file supplies the rows.
 *
 * ---------------------------------------------------------------------------
 * CITATIONS: WHERE THEY COME FROM AND WHERE THEY DO NOT
 * ---------------------------------------------------------------------------
 *
 * Every band actually charged carries its own `src` [`ResultBand.src`], and
 * that is what "every displayed rate has a citation" means concretely: one
 * `CitationRef` per band row. A component the year holds no rate for
 * (`bands: []`, the `component-not-implemented` / `rate-cap-not-implemented`
 * warnings already say so above this table) has no rate to cite, so its row
 * says so in words instead of showing an empty citation slot.
 *
 * The partition and deduction figures are not rates and are not individually
 * cited: `TaxResult` gives a single summed `personalRelief`, not one figure
 * per relief with its own `src` (the engine sums across
 * `taxYear.reliefs` without retaining which relief contributed what — see
 * `computeTax`), so a per-row citation there would have to be reconstructed by
 * re-running the engine's own eligibility test in this component, which is
 * exactly the duplicated-reasoning failure `compute.ts`'s file header warns
 * against. `result.sourcesUsed` already has every source the computation drew
 * on, deduplicated, and is rendered once at the foot of this section instead.
 *
 * ---------------------------------------------------------------------------
 * THE UNVERIFIED BADGE — WHY IT APPEARS ON THREE KINDS AND NOT ON TWO
 * ---------------------------------------------------------------------------
 *
 * `ui-design-system.md`'s component inventory puts `UnverifiedBadge` "on any
 * figure whose data carries `verified: false`", separately from the
 * `unverified-rate` *warning* `WarningList` already renders above the figure.
 *
 * For `capital-gain`, `terminal-benefit` and `special-business` this is a
 * direct, single-key lookup — `taxYear.separatelyRated[kind].verified` — the
 * exact flag `computeTax` itself reads before raising the warning
 * (`if (bands.length > 0 && !definition.verified)`), so showing it here
 * cannot disagree with the engine's own reasoning: it is the same boolean, not
 * a second opinion on it.
 *
 * For `ladder` and `capped` the equivalent flags are `taxYear.rateSchedules[
 * ladderId].verified` and the matching cap's `verified` — but getting
 * `ladderId` requires the same resolution order `computeTax`'s own
 * `resolveLadder` runs (`input.scheduleId`, then the conventional id, then
 * "the only schedule there is"), and getting the matching cap requires
 * `resolveRateCap`'s own "exactly one cap per schedule, or throw" rule. Both
 * are genuine engine logic, not a lookup, and reimplementing either here to
 * paint one badge is the second-copy-that-drifts problem this codebase's file
 * headers keep warning about (see `compute.ts`, `model.ts`). Y/A 2025/2026's
 * schedule and cap are both `verified: true` today, so the badge would not
 * even render for the one year this project holds — the `unverified-rate`
 * warning banner is the disclosure for that path, and no badge is attempted
 * here for `ladder` or `capped`. Worth revisiting if a later year's schedule
 * or cap is ever `false`.
 */

import type { ReactNode } from 'react';
import { Card, CitationRef, Table, UnverifiedBadge, formatRupees } from '../ui/index.ts';
import { HEADS, type ComponentKind, type Head } from '../../lib/tax/engine.ts';
import type { ComputedTaxResult } from '../ui/RefusalPanel.tsx';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './calculator.css';

const HEAD_LABEL: Record<Head, string> = {
  employment: 'A job you are paid for',
  business: 'Work you do for yourself',
  investment: 'Interest, dividends, rent and gains',
  other: 'Anything else',
};

const COMPONENT_LABEL: Record<ComponentKind, string> = {
  ladder: 'Ordinary income, on the standard bands',
  capped: 'Income taxed at the reduced maximum rate',
  'capital-gain': 'The gain on what you sold',
  'terminal-benefit': 'The payment you received for leaving a job',
  'special-business': 'Betting, gaming, liquor or tobacco business income',
};

/** Only these three kinds have a directly-lookupable `verified` flag. See the
 * file header for why `ladder` and `capped` are deliberately excluded. */
const SEPARATELY_RATED_KINDS = new Set<ComponentKind>([
  'capital-gain',
  'terminal-benefit',
  'special-business',
]);

export interface WorkingTableProps {
  result: ComputedTaxResult;
  taxYear: TaxYearFile;
}

export function WorkingTable({ result, taxYear }: WorkingTableProps) {
  return (
    <Card title="How this was worked out" headingLevel={3} id="calc-working">
      <div className="calc-working">
        <IncomeByHeadTable result={result} />
        <TaxableIncomeTable result={result} />
        <ComponentsTable result={result} taxYear={taxYear} />
        <CreditsTable result={result} />
        <SourcesUsed result={result} taxYear={taxYear} />
      </div>
    </Card>
  );
}

/* ========================================================================= */

function IncomeByHeadTable({ result }: { result: ComputedTaxResult }) {
  return (
    <Table
      caption="Income counted toward tax, by where it came from"
      columns={[
        { key: 'head', header: 'Where it came from', rowHeader: true },
        { key: 'amount', header: 'Amount (Rs.)', numeric: true },
      ]}
      rows={HEADS.map((head) => ({
        head: HEAD_LABEL[head],
        amount: formatRupees(result.assessableByHead[head]),
      }))}
      emptyMessage="Nothing was counted toward tax."
    />
  );
}

function TaxableIncomeTable({ result }: { result: ComputedTaxResult }) {
  const rows = [
    {
      step: 'Income relief can be deducted from',
      amount: formatRupees(result.partition.reliefEligible),
    },
    {
      step: 'Income relief cannot be deducted from (a gain on something sold)',
      amount: formatRupees(result.partition.reliefIneligible),
    },
    { step: 'Personal relief', amount: formatRupees(result.deduction.personalRelief) },
  ];
  if (result.deduction.qualifyingPayments > 0) {
    rows.push({
      step: 'Qualifying payments',
      amount: formatRupees(result.deduction.qualifyingPayments),
    });
  }
  rows.push(
    { step: 'Deducted in total', amount: formatRupees(result.deduction.total) },
    {
      step: 'Taxable ordinary income, after relief',
      amount: formatRupees(result.taxableMain),
    },
    {
      step: 'Taxable gain (relief is not deducted from a gain)',
      amount: formatRupees(result.taxableGain),
    },
  );

  return (
    <Table
      caption="Working out what is actually taxed"
      columns={[
        { key: 'step', header: 'Step', rowHeader: true },
        { key: 'amount', header: 'Amount (Rs.)', numeric: true },
      ]}
      rows={rows}
      emptyMessage="Nothing is taxable."
    />
  );
}

function ComponentsTable({
  result,
  taxYear,
}: {
  result: ComputedTaxResult;
  taxYear: TaxYearFile;
}) {
  const rows: Readonly<Record<string, ReactNode>>[] = [];

  result.components.forEach((component) => {
    const label = COMPONENT_LABEL[component.kind];
    const unverified =
      SEPARATELY_RATED_KINDS.has(component.kind) &&
      component.bands.length > 0 &&
      taxYear.separatelyRated[component.kind]?.verified === false;

    if (component.bands.length === 0) {
      rows.push({
        part: label,
        amount: formatRupees(component.amount),
        rate: 'No rate recorded for this in the data — see the warning above',
        tax: formatRupees(component.tax),
        citation: '',
      });
      return;
    }

    component.bands.forEach((band, bandIndex) => {
      const rateLabel =
        band.effectiveRateBp === band.rateBp
          ? `${band.rateBp / 100}%`
          : `${band.rateBp / 100}% capped to ${band.effectiveRateBp / 100}%`;

      rows.push({
        // A blank row header on every band after the first fails axe's
        // "table header text should not be empty" check, and rightly: a
        // screen-reader user landing on that cell directly gets nothing to
        // orient by. The repeat is visible only to a sighted reader who can
        // already see it belongs to the row above; everyone else hears the
        // component name on every band.
        part: bandIndex === 0 ? label : <span className="visually-hidden">{label}</span>,
        amount: formatRupees(band.amount),
        rate: rateLabel,
        tax: formatRupees(band.tax),
        citation: (
          <>
            <CitationRef src={band.src} sources={taxYear.sources} />
            {bandIndex === 0 && unverified && (
              <UnverifiedBadge what={label.toLowerCase()} compact />
            )}
          </>
        ),
      });
    });
  });

  rows.push({
    part: 'Gross tax — every part above, added together',
    amount: '',
    rate: '',
    tax: formatRupees(result.grossTax),
    citation: '',
  });

  return (
    <Table
      caption="Tax on each part of your income"
      columns={[
        { key: 'part', header: 'Part of your income', rowHeader: true },
        { key: 'amount', header: 'Amount taxed (Rs.)', numeric: true },
        { key: 'rate', header: 'Rate' },
        { key: 'tax', header: 'Tax (Rs.)', numeric: true },
        { key: 'citation', header: 'Where this rate comes from' },
      ]}
      rows={rows}
      emptyMessage="No tax has been charged on any part of your income."
    />
  );
}

function CreditsTable({ result }: { result: ComputedTaxResult }) {
  const rows = [
    {
      credit: 'Tax an employer already deducted from your pay',
      amount: formatRupees(result.credits.apit),
    },
    {
      credit: 'Tax already withheld on interest, dividends or rent',
      amount: formatRupees(result.credits.ait),
    },
    {
      credit: 'Tax credited for tax you already paid abroad',
      amount: formatRupees(result.credits.foreign),
    },
    { credit: 'Credited in total', amount: formatRupees(result.credits.total) },
  ];
  if (result.credits.excess > 0) {
    rows.push({
      credit: 'Credited but not needed against this tax (see the warning above)',
      amount: formatRupees(result.credits.excess),
    });
  }

  return (
    <Table
      caption="Tax already paid or credited"
      columns={[
        { key: 'credit', header: 'Credit', rowHeader: true },
        { key: 'amount', header: 'Amount (Rs.)', numeric: true },
      ]}
      rows={rows}
      emptyMessage="No tax has been credited."
    />
  );
}

function SourcesUsed({
  result,
  taxYear,
}: {
  result: ComputedTaxResult;
  taxYear: TaxYearFile;
}) {
  if (result.sourcesUsed.length === 0) return null;

  return (
    <div className="calc-working__sources">
      <p className="calc-working__sources-label">
        Every source this computation drew on, including the relief and the deduction
        figures above, which are not shown rate-by-rate:
      </p>
      <ul className="calc-working__sources-list">
        {result.sourcesUsed.map((src) => (
          <li key={src}>
            <CitationRef src={src} sources={taxYear.sources} />
          </li>
        ))}
      </ul>
    </div>
  );
}

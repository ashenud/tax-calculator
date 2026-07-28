/**
 * Engine part 1 — partition, the single aggregate deduction, and the normal ladder.
 *
 * Fixtures here are **synthetic and unit-level** by design: they exercise one rule each,
 * and every expected figure is arithmetic a reader can check in their head against the
 * band table in the fixture itself. The worked examples in `docs/worked-examples/` become
 * the end-to-end suite in P07.
 *
 * Two assertions in this file are the reason it exists. Both are written as
 * failing-before-fixing tests — each was confirmed to fail against the plausible wrong
 * implementation before the correct one was written:
 *
 *   - "relief is applied once, to the aggregate" fails if relief is applied per head
 *   - "relief does not touch the capital gain" fails if gains are pooled with income
 *     before deducting [IRA Sch.5 para 2(a), as enacted 2017]
 *
 * Assertions are field by field, never on `taxPayable` alone: a total-only assertion
 * lets two compensating errors through.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeTax, walkBands, type TaxInput, type TaxYearData } from './engine';
import { loadTaxYears } from './load';
import { taxYearFileSchema } from './schema';

// ---------------------------------------------------------------------------
// Synthetic tax years
// ---------------------------------------------------------------------------

interface DraftBand {
  width: number | null;
  rateBp: number;
  src: string;
}

/** The Y/A 2025/2026 individual ladder shape. Cumulative boundaries fall at
 * 1,000,000 / 1,500,000 / 2,000,000 / 2,500,000. */
const LADDER_BANDS: DraftBand[] = [
  { width: 1_000_000, rateBp: 600, src: 'test-src' },
  { width: 500_000, rateBp: 1800, src: 'test-src' },
  { width: 500_000, rateBp: 2400, src: 'test-src' },
  { width: 500_000, rateBp: 3000, src: 'test-src' },
  { width: null, rateBp: 3600, src: 'test-src' },
];

const RELIEF = 1_800_000;

interface YearOptions {
  bands?: DraftBand[];
  scheduleId?: string;
  scheduleVerified?: boolean;
  reliefAmount?: number;
  noRelief?: boolean;
  qualifyingPaymentTypes?: { id: string; cap: number; rate: number; src: string }[];
  startYear?: number;
}

/** Built through the real Zod schema, so a synthetic fixture can never assert behaviour
 * on data the loader would have rejected. */
function makeYear(opts: YearOptions = {}): TaxYearData {
  const startYear = opts.startYear ?? 2025;
  const scheduleId = opts.scheduleId ?? 'individual-normal';

  const reliefs = opts.noRelief
    ? {}
    : {
        personal: {
          amount: opts.reliefAmount ?? RELIEF,
          appliesTo: ['resident', 'non-resident-citizen'],
          src: 'test-src',
        },
      };

  return taxYearFileSchema.parse({
    schemaVersion: 1,
    yearOfAssessment: `${startYear}/${startYear + 1}`,
    period: { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` },
    status: 'enacted',
    lastReviewed: `${startYear + 1}-03-31`,
    sources: {
      'test-src': {
        title: 'Synthetic fixture source — not a citation, unit test data only',
        file: 'docs/sources/SYNTHETIC-TEST-FIXTURE',
      },
    },
    reliefs,
    qualifyingPayments: opts.qualifyingPaymentTypes ?? [],
    rateSchedules: {
      [scheduleId]: {
        label: 'Synthetic individual ladder',
        verified: opts.scheduleVerified ?? true,
        bands: opts.bands ?? LADDER_BANDS,
      },
    },
    rateCaps: {},
    conditions: {},
    separatelyRated: {},
    apit: { tables: [], src: 'test-src' },
    wht: {},
    calendar: {
      instalments: [{ quarter: 1, due: `${startYear}-08-15`, src: 'test-src' }],
      returnDueRule: { monthsAfterYearEnd: 8, src: 'test-src' },
    },
  });
}

/** One head, one untagged amount — the simplest possible taxpayer. */
function salaryOf(amount: number): TaxInput {
  return {
    residency: 'resident',
    income: { employment: [{ label: 'Salary', amount }] },
  };
}

/** Taxable income `t` requires gross income `t + relief`. */
function taxOnTaxableIncome(taxable: number, year: TaxYearData = makeYear()): number {
  return computeTax(salaryOf(taxable + RELIEF), year).grossTax;
}

// ---------------------------------------------------------------------------
// Below the relief threshold
// ---------------------------------------------------------------------------

describe('income below the relief threshold', () => {
  const year = makeYear();

  it('charges no tax on income one rupee below the relief', () => {
    const result = computeTax(salaryOf(RELIEF - 1), year);

    expect(result.partition).toEqual({ reliefEligible: 1_799_999, reliefIneligible: 0 });
    expect(result.deduction).toEqual({
      personalRelief: RELIEF,
      qualifyingPayments: 0,
      total: RELIEF,
    });
    expect(result.taxableMain).toBe(0);
    expect(result.taxableGain).toBe(0);
    expect(result.components).toEqual([{ kind: 'ladder', amount: 0, bands: [], tax: 0 }]);
    expect(result.grossTax).toBe(0);
    expect(result.taxPayable).toBe(0);
  });

  it('charges no tax at exactly the relief threshold', () => {
    const result = computeTax(salaryOf(RELIEF), year);
    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
  });

  it('taxes one rupee above the relief at the first band, which floors to zero', () => {
    const result = computeTax(salaryOf(RELIEF + 1), year);
    expect(result.taxableMain).toBe(1);
    expect(result.components[0]?.bands).toEqual([
      { amount: 1, rateBp: 600, effectiveRateBp: 600, tax: 0, src: 'test-src' },
    ]);
    expect(result.grossTax).toBe(0);
  });

  it('gives no personal relief to a residency the relief does not name', () => {
    const result = computeTax(
      {
        residency: 'non-resident',
        income: { employment: [{ label: 'S', amount: RELIEF }] },
      },
      year,
    );
    expect(result.deduction.personalRelief).toBe(0);
    expect(result.taxableMain).toBe(RELIEF);
    // 1,000,000 @ 6% + 500,000 @ 18% + 300,000 @ 24% = 60,000 + 90,000 + 72,000
    expect(result.grossTax).toBe(222_000);
  });
});

// ---------------------------------------------------------------------------
// Band boundaries
// ---------------------------------------------------------------------------

describe('band boundaries, just below and just above', () => {
  // Each row is [taxable income, expected gross tax], computed by hand from the ladder:
  //   1,000,000 @ 6% = 60,000 | next 500,000 @ 18% = 90,000 | next 500,000 @ 24% = 120,000
  //   next 500,000 @ 30% = 150,000 | balance @ 36%
  const cases: [label: string, taxable: number, expected: number][] = [
    // band 1 / band 2 boundary at 1,000,000
    ['just below band 1/2', 999_999, 59_999],
    ['exactly at band 1/2', 1_000_000, 60_000],
    ['just above band 1/2', 1_000_001, 60_000],
    ['clear of band 1/2', 1_000_100, 60_018],
    // band 2 / band 3 boundary at 1,500,000
    ['just below band 2/3', 1_499_999, 149_999],
    ['exactly at band 2/3', 1_500_000, 150_000],
    ['just above band 2/3', 1_500_100, 150_024],
    // band 3 / band 4 boundary at 2,000,000
    ['just below band 3/4', 1_999_999, 269_999],
    ['exactly at band 3/4', 2_000_000, 270_000],
    ['just above band 3/4', 2_000_100, 270_030],
    // band 4 / balance boundary at 2,500,000
    ['just below band 4/balance', 2_499_999, 419_999],
    ['exactly at band 4/balance', 2_500_000, 420_000],
    ['just above band 4/balance', 2_500_001, 420_000],
    ['clear of band 4/balance', 2_500_100, 420_036],
  ];

  for (const [label, taxable, expected] of cases) {
    it(`${label}: taxable ${taxable} -> ${expected}`, () => {
      expect(taxOnTaxableIncome(taxable)).toBe(expected);
    });
  }

  it('opens the next band only once the previous one is exactly full', () => {
    const atBoundary = computeTax(salaryOf(1_000_000 + RELIEF), makeYear());
    expect(atBoundary.components[0]?.bands).toHaveLength(1);

    const overBoundary = computeTax(salaryOf(1_000_001 + RELIEF), makeYear());
    expect(overBoundary.components[0]?.bands).toHaveLength(2);
    expect(overBoundary.components[0]?.bands[1]).toEqual({
      amount: 1,
      rateBp: 1800,
      effectiveRateBp: 1800,
      tax: 0,
      src: 'test-src',
    });
  });

  it('band amounts sum to taxable income and band tax sums to gross tax', () => {
    const result = computeTax(salaryOf(4_000_000), makeYear());
    const bands = result.components[0]?.bands ?? [];
    expect(bands.reduce((n, b) => n + b.amount, 0)).toBe(result.taxableMain);
    expect(bands.reduce((n, b) => n + b.tax, 0)).toBe(result.grossTax);
  });
});

// ---------------------------------------------------------------------------
// Rounding: floor per band, then sum
// ---------------------------------------------------------------------------

describe('rounding', () => {
  it('floors each band and then sums, never sums and then rounds', () => {
    // 555 @ 11.11% = 61.6605 -> 61 ; 555 @ 9.99% = 55.4445 -> 55 ; floor-per-band = 116.
    // Summing first gives 117.105 -> 117. The two answers differ, which is the point.
    const year = makeYear({
      noRelief: true,
      bands: [
        { width: 555, rateBp: 1111, src: 'test-src' },
        { width: null, rateBp: 999, src: 'test-src' },
      ],
    });
    const result = computeTax(salaryOf(1110), year);

    expect(result.components[0]?.bands.map((b) => b.tax)).toEqual([61, 55]);
    expect(result.grossTax).toBe(116);
    expect(result.grossTax).not.toBe(117);
  });

  it('never produces a fractional rupee', () => {
    for (let taxable = 0; taxable < 400; taxable += 7) {
      const tax = taxOnTaxableIncome(taxable);
      expect(Number.isInteger(tax)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// ERROR 1: relief applied once, on the aggregate — not per head
// ---------------------------------------------------------------------------

describe('the aggregate Fifth Schedule deduction [IRA s.52(1)]', () => {
  it('applies relief exactly once across two heads of income', () => {
    // Employment 2,000,000 + business 2,000,000 = 4,000,000 assessable.
    // Correct:   4,000,000 - 1,800,000 = 2,200,000 taxable -> 330,000 tax.
    // Per head:  each head 2,000,000 - 1,800,000 = 200,000 -> 24,000 tax. Wildly lower.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 2_000_000 }],
          business: [{ label: 'Consultancy', amount: 2_000_000 }],
        },
      },
      makeYear(),
    );

    expect(result.assessableByHead).toEqual({
      employment: 2_000_000,
      business: 2_000_000,
      investment: 0,
      other: 0,
    });
    expect(result.partition.reliefEligible).toBe(4_000_000);
    // The deduction is ONE amount, not one per head.
    expect(result.deduction).toEqual({
      personalRelief: RELIEF,
      qualifyingPayments: 0,
      total: RELIEF,
    });
    expect(result.taxableMain).toBe(2_200_000);
    // 60,000 + 90,000 + 120,000 + 200,000 @ 30% = 60,000
    expect(result.components[0]?.bands.map((b) => b.tax)).toEqual([
      60_000, 90_000, 120_000, 60_000,
    ]);
    expect(result.grossTax).toBe(330_000);
    expect(result.grossTax).not.toBe(24_000); // the per-head answer
  });

  it('gives the same answer whether income arrives as one head or four', () => {
    const asOne = computeTax(salaryOf(4_000_000), makeYear());
    const asFour = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'a', amount: 1_000_000 }],
          business: [{ label: 'b', amount: 1_000_000 }],
          investment: [{ label: 'c', amount: 1_000_000 }],
          other: [{ label: 'd', amount: 1_000_000 }],
        },
      },
      makeYear(),
    );

    expect(asFour.deduction.total).toBe(RELIEF);
    expect(asFour.taxableMain).toBe(asOne.taxableMain);
    expect(asFour.grossTax).toBe(asOne.grossTax);
  });

  it('deducts relief and qualifying payments together, as one amount', () => {
    const result = computeTax(
      { ...salaryOf(4_000_000), qualifyingPayments: 200_000 },
      makeYear(),
    );

    expect(result.deduction).toEqual({
      personalRelief: RELIEF,
      qualifyingPayments: 200_000,
      total: 2_000_000,
    });
    expect(result.taxableMain).toBe(2_000_000);
    expect(result.grossTax).toBe(270_000);
  });

  it('floors taxable income at zero rather than going negative', () => {
    const result = computeTax(
      { ...salaryOf(500_000), qualifyingPayments: 100_000 },
      makeYear(),
    );
    expect(result.deduction.total).toBe(1_900_000);
    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
    expect(result.taxPayable).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ERROR 2: relief does not touch capital gains
// ---------------------------------------------------------------------------

describe('partition before deduction [IRA Sch.5 para 2(a), as enacted 2017]', () => {
  it('leaves the capital gain untouched by relief', () => {
    // Salary 3,000,000 + gain 1,000,000.
    // Correct: relief comes off the 3,000,000 only -> taxable main 1,200,000,
    //          taxable gain 1,000,000 in full.
    // Pooled:  4,000,000 - 1,800,000 = 2,200,000 on the ladder and no gain left,
    //          which overstates relief and understates tax.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 3_000_000 }],
          investment: [
            { label: 'Sale of land', amount: 1_000_000, tags: ['capital-gain'] },
          ],
        },
      },
      makeYear(),
    );

    expect(result.partition).toEqual({
      reliefEligible: 3_000_000,
      reliefIneligible: 1_000_000,
    });
    expect(result.deduction.total).toBe(RELIEF);
    expect(result.taxableMain).toBe(1_200_000);
    // The whole gain survives the deduction, to the rupee.
    expect(result.taxableGain).toBe(1_000_000);
    expect(result.taxableGain).not.toBe(0);
    // 60,000 + 200,000 @ 18% = 36,000
    expect(result.components[0]).toEqual({
      kind: 'ladder',
      amount: 1_200_000,
      bands: [
        {
          amount: 1_000_000,
          rateBp: 600,
          effectiveRateBp: 600,
          tax: 60_000,
          src: 'test-src',
        },
        {
          amount: 200_000,
          rateBp: 1800,
          effectiveRateBp: 1800,
          tax: 36_000,
          src: 'test-src',
        },
      ],
      tax: 96_000,
    });
    // Not 2,200,000 on the ladder: that is the pooled (wrong) answer.
    expect(result.components[0]?.amount).not.toBe(2_200_000);
  });

  it('does not spill unused relief onto the gain', () => {
    // Only 500,000 of the 1,800,000 relief can be used. The remaining 1,300,000
    // must NOT reduce the gain — the floor at zero applies to taxableMain only.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 500_000 }],
          investment: [{ label: 'Sale', amount: 5_000_000, tags: ['capital-gain'] }],
        },
      },
      makeYear(),
    );

    expect(result.partition).toEqual({
      reliefEligible: 500_000,
      reliefIneligible: 5_000_000,
    });
    expect(result.taxableMain).toBe(0);
    expect(result.taxableGain).toBe(5_000_000);
    expect(result.taxableGain).not.toBe(3_700_000); // 5,000,000 - unused relief
    expect(result.components[0]?.tax).toBe(0);
  });

  it('taxes the gain nowhere on the ladder, and says so with a blocking warning', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 3_000_000 }],
          investment: [{ label: 'Sale', amount: 1_000_000, tags: ['capital-gain'] }],
        },
      },
      makeYear(),
    );

    const gain = result.components.find((c) => c.kind === 'capital-gain');
    expect(gain).toEqual({ kind: 'capital-gain', amount: 1_000_000, bands: [], tax: 0 });
    // The gain's own rate is P05's work. Until then the figure is incomplete, and the
    // engine must say so rather than let a silent zero read as "no tax due".
    expect(
      result.warnings.some(
        (w) => w.code === 'component-not-implemented' && w.severity === 'blocking',
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Everything is resolved from the taxYear argument
// ---------------------------------------------------------------------------

describe('rates come only from the taxYear argument', () => {
  it('changing a band rate in the data changes the answer', () => {
    const doubled = makeYear({
      bands: [
        { width: 1_000_000, rateBp: 1200, src: 'test-src' },
        ...LADDER_BANDS.slice(1),
      ],
    });
    expect(taxOnTaxableIncome(1_000_000)).toBe(60_000);
    expect(taxOnTaxableIncome(1_000_000, doubled)).toBe(120_000);
  });

  it('changing the relief in the data changes the answer', () => {
    const generous = makeYear({ reliefAmount: 3_000_000 });
    const result = computeTax(salaryOf(3_000_000), generous);
    expect(result.deduction.personalRelief).toBe(3_000_000);
    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
  });

  it('computes each year of assessment from its own data, with no cross-talk', () => {
    const y2024 = makeYear({
      startYear: 2024,
      reliefAmount: 1_200_000,
      bands: [{ width: null, rateBp: 1000, src: 'test-src' }],
    });
    const y2025 = makeYear();

    const before = computeTax(salaryOf(3_000_000), y2024);
    computeTax(salaryOf(3_000_000), y2025);
    const after = computeTax(salaryOf(3_000_000), y2024);

    expect(before.yearOfAssessment).toBe('2024/2025');
    expect(before.taxableMain).toBe(1_800_000);
    expect(before.grossTax).toBe(180_000);
    // Recomputing an earlier year after a later one returns the identical result —
    // if it did not, a rate would be resolved from somewhere other than the argument.
    expect(after).toEqual(before);
  });

  it('reports the source of every rate it actually applied', () => {
    const result = computeTax(salaryOf(3_000_000), makeYear());
    expect(result.sourcesUsed).toEqual(['test-src']);
  });

  it('throws rather than guess when the ladder cannot be resolved', () => {
    const year = makeYear({ scheduleId: 'something-else' });
    const twoSchedules = taxYearFileSchema.parse({
      ...year,
      rateSchedules: {
        'schedule-a': year.rateSchedules['something-else'],
        'schedule-b': year.rateSchedules['something-else'],
      },
    });

    // One schedule, unconventional id: usable, because there is nothing to choose between.
    expect(() => computeTax(salaryOf(3_000_000), year)).not.toThrow();
    // Two schedules and no "individual-normal": ambiguous, so it stops.
    expect(() => computeTax(salaryOf(3_000_000), twoSchedules)).toThrow(
      /cannot resolve the normal ladder/,
    );
    expect(() =>
      computeTax({ ...salaryOf(3_000_000), scheduleId: 'nope' }, year),
    ).toThrow(/is not a schedule in rateSchedules/);
  });
});

// ---------------------------------------------------------------------------
// Warnings: unverified rates, and the parts this slice does not compute
// ---------------------------------------------------------------------------

describe('warnings', () => {
  it('warns when it applies a schedule marked verified: false', () => {
    const year = makeYear({ scheduleVerified: false });
    const result = computeTax(salaryOf(3_000_000), year);
    expect(result.warnings.map((w) => w.code)).toContain('unverified-rate');
  });

  it('does not warn about an unverified schedule it never actually charged', () => {
    const year = makeYear({ scheduleVerified: false });
    const result = computeTax(salaryOf(RELIEF), year);
    expect(result.grossTax).toBe(0);
    expect(result.warnings.map((w) => w.code)).not.toContain('unverified-rate');
  });

  it('warns, blockingly, that the maximum-rate cap is not applied', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Overseas consultancy',
              amount: 4_000_000,
              tags: ['foreign-capped'],
            },
          ],
        },
      },
      makeYear(),
    );
    const warning = result.warnings.find((w) => w.code === 'rate-cap-not-implemented');
    expect(warning?.severity).toBe('blocking');
    // The cap is P05's. Until then this income sits on the full ladder, which
    // overstates rather than understates — and the warning says which way it errs.
    expect(result.taxableMain).toBe(2_200_000);
    expect(result.grossTax).toBe(330_000);
  });

  it('carves separately-rated components off the ladder without rating them', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [
            { label: 'Salary', amount: 4_000_000 },
            {
              label: 'Gratuity',
              amount: 2_000_000,
              tags: ['terminal-benefit'],
              serviceYears: 25,
            },
          ],
        },
      },
      makeYear(),
    );

    expect(result.taxableMain).toBe(4_200_000);
    // "only the remainder ... shall be taxed at the rates referred to in
    // subparagraph (1)" [IRA Sch.1 para 1(2)(d), as enacted 2017]
    expect(result.components[0]?.amount).toBe(2_200_000);
    expect(result.components.find((c) => c.kind === 'terminal-benefit')).toEqual({
      kind: 'terminal-benefit',
      amount: 2_000_000,
      bands: [],
      tax: 0,
    });
    expect(
      result.warnings.filter((w) => w.code === 'component-not-implemented'),
    ).toHaveLength(1);
  });

  it('warns when the year declares qualifying payment types it cannot interpret', () => {
    const year = makeYear({
      qualifyingPaymentTypes: [
        { id: 'approved-charity', cap: 75_000, rate: 10_000, src: 'test-src' },
      ],
    });
    const result = computeTax(salaryOf(3_000_000), year);
    expect(result.warnings.map((w) => w.code)).toContain(
      'qualifying-payment-types-not-modelled',
    );
  });
});

// ---------------------------------------------------------------------------
// Shape: later slices extend it, they do not reshape it
// ---------------------------------------------------------------------------

describe('result shape', () => {
  it('carries every field of TaxResult, with the later slices zeroed not absent', () => {
    const result = computeTax(salaryOf(3_000_000), makeYear());

    expect(Object.keys(result).sort()).toEqual(
      [
        'assessableByHead',
        'components',
        'credits',
        'deduction',
        'grossTax',
        'partition',
        'refusals',
        'schedule',
        'sourcesUsed',
        'taxPayable',
        'taxableGain',
        'taxableMain',
        'warnings',
        'yearOfAssessment',
      ].sort(),
    );
    expect(result.credits).toEqual({
      apit: 0,
      ait: 0,
      foreign: 0,
      total: 0,
      excess: 0,
    });
    // P06 owns this field and has now filled it. `instalments` is still empty, because
    // this input carries no s.91/s.92 estimate and the engine will not substitute the
    // liability it computed for the taxpayer's own estimate [IRA s.90(3)]; `returnDue`
    // is derived regardless, because the filing deadline depends on nothing but the year
    // [IRA s.93(1)] — 31 March 2026 plus the data's eight months.
    expect(result.schedule).toEqual({
      instalments: [],
      finalPayment: { due: '', amount: 0 },
      returnDue: '2026-11-30',
    });
    expect(result.refusals).toEqual([]);
    expect(result.yearOfAssessment).toBe('2025/2026');
  });
});

// ---------------------------------------------------------------------------
// Input validation — integer rupees, and no invented treatment for a loss
// ---------------------------------------------------------------------------

describe('input validation', () => {
  const year = makeYear();

  it('rejects a float amount rather than silently rounding it', () => {
    expect(() => computeTax(salaryOf(3_000_000.5), year)).toThrow(
      /integer rupees, never a float/,
    );
  });

  it('rejects a negative amount', () => {
    expect(() => computeTax(salaryOf(-1), year)).toThrow(/non-negative/);
  });

  it('rejects a float deduction', () => {
    expect(() =>
      computeTax({ ...salaryOf(3_000_000), deductions: { employment: 0.5 } }, year),
    ).toThrow(/integer rupees, never a float/);
  });

  it('subtracts a head deduction from that head only', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: { business: [{ label: 'Consultancy', amount: 6_000_000 }] },
        deductions: { business: 450_000 },
      },
      year,
    );
    expect(result.assessableByHead.business).toBe(5_550_000);
    expect(result.taxableMain).toBe(3_750_000);
  });

  it('stops rather than invent loss treatment when a head goes negative', () => {
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: { business: [{ label: 'Consultancy', amount: 100 }] },
          deductions: { business: 200 },
        },
        year,
      ),
    ).toThrow(/Loss treatment is not modelled/);
  });

  it('stops rather than apportion a head deduction across tagged income', () => {
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: {
            investment: [
              { label: 'Rent', amount: 1_000_000 },
              { label: 'Sale', amount: 1_000_000, tags: ['capital-gain'] },
            ],
          },
          deductions: { investment: 100_000 },
        },
        year,
      ),
    ).toThrow(/will not guess/);
  });

  it('rejects a rate schedule with no unbounded final band', () => {
    // Not reachable through the loader (the schema forbids it), so asserted directly.
    expect(() => walkBands(100, [{ width: 10, rateBp: 600, src: 'x' }])).toThrow(
      /does not cover the full amount/,
    );
  });
});

// ---------------------------------------------------------------------------
// Purity
// ---------------------------------------------------------------------------

describe('purity', () => {
  it('returns an identical result for identical arguments', () => {
    const input = salaryOf(4_321_000);
    const year = makeYear();
    expect(computeTax(input, year)).toEqual(computeTax(input, year));
  });

  it('does not mutate its arguments', () => {
    const input = salaryOf(4_321_000);
    const year = makeYear();
    const inputBefore = structuredClone(input);
    const yearBefore = structuredClone(year);
    computeTax(input, year);
    expect(input).toEqual(inputBefore);
    expect(year).toEqual(yearBefore);
  });

  it('contains no reference to the clock or to randomness', () => {
    // A guard against future drift: an engine that reads the current date cannot be
    // reproduced by a fixture, and one that reads a global rate is not year-scoped.
    const source = readFileSync(
      fileURLToPath(new URL('./engine.ts', import.meta.url)),
      'utf-8',
    );
    expect(source).not.toMatch(/\bDate\.now\b/);
    expect(source).not.toMatch(/\bnew Date\b/);
    expect(source).not.toMatch(/\bMath\.random\b/);
    expect(source).not.toMatch(/\bperformance\.now\b/);
    // Rates are applied in BigInt, so none of the float-rounding escape hatches
    // should appear: Math.round in particular is how sum-then-round creeps back in.
    expect(source).not.toMatch(/\bMath\.round\b/);
    expect(source).not.toMatch(/\btoFixed\b/);
    expect(source).not.toMatch(/\bparseFloat\b/);
  });
});

// ---------------------------------------------------------------------------
// Property sweep
// ---------------------------------------------------------------------------

describe('properties over a bounded sweep', () => {
  // fast-check is not a dependency (see package.json), so this is a deterministic
  // pseudo-random sweep: a fixed seed means a failure is reproducible.
  function lcg(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state;
    };
  }

  it('always produces non-negative integers, for any non-negative integer input', () => {
    const next = lcg(20250401);
    const year = makeYear();

    for (let i = 0; i < 2000; i++) {
      const employment = next() % 20_000_000;
      const business = next() % 5_000_000;
      const gain = next() % 3_000_000;
      const qualifying = next() % 500_000;

      const result = computeTax(
        {
          residency: 'resident',
          income: {
            employment: [{ label: 'e', amount: employment }],
            business: [{ label: 'b', amount: business }],
            investment: [{ label: 'g', amount: gain, tags: ['capital-gain'] }],
          },
          qualifyingPayments: qualifying,
        },
        year,
      );

      for (const [field, value] of Object.entries({
        taxableMain: result.taxableMain,
        taxableGain: result.taxableGain,
        grossTax: result.grossTax,
        taxPayable: result.taxPayable,
      })) {
        expect(
          Number.isSafeInteger(value) && value >= 0,
          `${field} = ${value} for input ${employment}/${business}/${gain}/${qualifying}`,
        ).toBe(true);
      }

      // Internal consistency: the working must add up to the total it reports.
      for (const component of result.components) {
        expect(component.bands.reduce((n, b) => n + b.tax, 0)).toBe(component.tax);
        expect(
          component.bands.every((b) => Number.isSafeInteger(b.tax) && b.tax >= 0),
        ).toBe(true);
      }
      expect(result.components.reduce((n, c) => n + c.tax, 0)).toBe(result.grossTax);

      // No band charges more than 100%, so tax can never exceed the amount taxed.
      expect(result.grossTax).toBeLessThanOrEqual(result.taxableMain);
      // The gain is the gain, whatever else happened.
      expect(result.taxableGain).toBe(gain);
    }
  });

  it('never charges less tax on more income', () => {
    const year = makeYear();
    let previous = 0;
    for (let income = 0; income <= 6_000_000; income += 13_337) {
      const tax = computeTax(salaryOf(income), year).grossTax;
      expect(tax).toBeGreaterThanOrEqual(previous);
      previous = tax;
    }
  });
});

// ---------------------------------------------------------------------------
// Sanity check against the real Y/A 2025/2026 data
// ---------------------------------------------------------------------------

describe('Y/A 2025/2026, from the committed data file', () => {
  const loaded = loadTaxYears().find((y) => y.data.yearOfAssessment === '2025/2026');
  const year = loaded?.data;

  it('has the Y/A 2025/2026 data file loaded', () => {
    expect(year).toBeDefined();
  });

  it('computes a salaried resident field by field', () => {
    if (!year) throw new Error('Y/A 2025/2026 data not found');
    const result = computeTax(salaryOf(5_000_000), year);

    expect(result.yearOfAssessment).toBe('2025/2026');
    expect(result.assessableByHead).toEqual({
      employment: 5_000_000,
      business: 0,
      investment: 0,
      other: 0,
    });
    expect(result.partition).toEqual({
      reliefEligible: 5_000_000,
      reliefIneligible: 0,
    });
    expect(result.deduction).toEqual({
      personalRelief: 1_800_000,
      qualifyingPayments: 0,
      total: 1_800_000,
    });
    expect(result.taxableMain).toBe(3_200_000);
    expect(result.taxableGain).toBe(0);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.kind).toBe('ladder');
    expect(result.components[0]?.bands.map((b) => [b.amount, b.rateBp, b.tax])).toEqual([
      [1_000_000, 600, 60_000],
      [500_000, 1800, 90_000],
      [500_000, 2400, 120_000],
      [500_000, 3000, 150_000],
      [700_000, 3600, 252_000],
    ]);
    expect(result.grossTax).toBe(672_000);
    expect(result.taxPayable).toBe(672_000);
    expect(result.warnings).toEqual([]);
    expect(result.refusals).toEqual([]);
    expect(result.sourcesUsed).toEqual([
      'act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1',
      'act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)',
    ]);
  });

  it('charges nothing below the 1,800,000 relief', () => {
    if (!year) throw new Error('Y/A 2025/2026 data not found');
    const result = computeTax(salaryOf(1_799_999), year);
    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
  });
});

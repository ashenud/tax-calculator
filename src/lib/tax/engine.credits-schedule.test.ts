/**
 * Engine part 3 — credits (step 7) and the payment schedule (step 8).
 *
 * `engine.test.ts` (P04) owns the partition, the deduction and the ladder;
 * `engine.components.test.ts` (P05) owns the separately-rated components, the cap and the
 * Q14 refusal. Both are left alone; this file only exercises what they stubbed.
 *
 * Four assertions are the reason this file exists, and each was written against the
 * plausible wrong implementation:
 *
 *   - **the foreign tax credit is capped per source, not per taxpayer.** `describe('the
 *     foreign tax credit is computed per source')` gives one source more foreign tax than
 *     its cap and another less. Summing all foreign tax and capping once credits 900,000;
 *     capping each source credits 616,000. Only the second is [IRA s.81(1)].
 *   - **instalments are the s.90(3) formula, not a quarter each.** An estimate of 10
 *     rupees over four instalments is 2, 2, 3, 3 — a flat quarter is 2, 2, 2, 2 and loses
 *     two rupees.
 *   - **the schedule reconciles to the liability, not to the estimate.** Every case here
 *     asserts `instalments + finalPayment === taxPayable`, including when the estimate is
 *     far too low and far too high.
 *   - **excess credit is surfaced, not floored away.** `taxPayable` being 0 is asserted
 *     together with `credits.excess` being the surplus, never alone.
 *
 * Assertions are field by field, never on `taxPayable` alone: a total-only assertion lets
 * two compensating errors through.
 *
 * One fixture below depends on a rate marked `verified: false` in the committed data — the
 * capital gains rate, superseded by Act No. 11 of 2026 (Q42). It is quarantined in
 * `describe('a foreign gain [...] KNOWN-UNVERIFIED RATE')` and asserts the engine's own
 * `unverified-rate` warning alongside its figures, so the flag travels with the number.
 */

import { describe, expect, it } from 'vitest';
import {
  addMonthsToIsoDate,
  computeTax,
  isRefusal,
  type TaxInput,
  type TaxYearData,
} from './engine';
import { loadTaxYears } from './load';
import { taxYearFileSchema } from './schema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REAL_YEAR = loadTaxYears().find(
  (y) => y.data.yearOfAssessment === '2025/2026',
)?.data;

function realYear(): TaxYearData {
  if (!REAL_YEAR) throw new Error('Y/A 2025/2026 data not found');
  return REAL_YEAR;
}

const REMITTED = 'remitted-through-bank-to-sri-lanka';
const RELIEF = 1_800_000;

/** Well inside the two-year window for Y/A 2025/2026, which closes on 2028-03-31. */
const PAID_IN_WINDOW = '2026-01-31';

interface DraftInstalment {
  quarter: number;
  due: string;
  src: string;
}

interface YearOptions {
  startYear?: number;
  monthsAfterYearEnd?: number;
  instalments?: DraftInstalment[];
}

/** Built through the real Zod schema, so no synthetic fixture asserts behaviour on data
 * the loader would have rejected. The ladder mirrors the real one; these fixtures exist
 * for the calendar, which the real file can only express one way. */
function makeYear(opts: YearOptions = {}): TaxYearData {
  const startYear = opts.startYear ?? 2025;

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
    reliefs: {
      personal: {
        amount: RELIEF,
        appliesTo: ['resident', 'non-resident-citizen'],
        src: 'test-src',
      },
    },
    qualifyingPayments: [],
    rateSchedules: {
      'individual-normal': {
        label: 'Synthetic individual ladder',
        verified: true,
        bands: [
          { width: 1_000_000, rateBp: 600, src: 'test-src' },
          { width: 500_000, rateBp: 1800, src: 'test-src' },
          { width: 500_000, rateBp: 2400, src: 'test-src' },
          { width: 500_000, rateBp: 3000, src: 'test-src' },
          { width: null, rateBp: 3600, src: 'test-src' },
        ],
      },
    },
    rateCaps: {},
    conditions: {},
    separatelyRated: {},
    apit: { tables: [], src: 'test-src' },
    wht: {},
    calendar: {
      instalments: opts.instalments ?? [
        { quarter: 1, due: `${startYear}-08-15`, src: 'test-src' },
        { quarter: 2, due: `${startYear}-11-15`, src: 'test-src' },
        { quarter: 3, due: `${startYear + 1}-02-15`, src: 'test-src' },
        { quarter: 4, due: `${startYear + 1}-05-15`, src: 'test-src' },
      ],
      returnDueRule: {
        monthsAfterYearEnd: opts.monthsAfterYearEnd ?? 8,
        src: 'test-src',
      },
    },
  });
}

function salaryOf(amount: number): TaxInput {
  return {
    residency: 'resident',
    income: { employment: [{ label: 'Salary', amount }] },
  };
}

/** A whole year of foreign-currency consultancy, remitted unless stated otherwise. */
function consultancy(
  amount: number,
  foreignTax?: { paid: number; paidOn: string },
  remitted = true,
): TaxInput {
  return {
    residency: 'resident',
    income: {
      business: [
        {
          label: 'Overseas consultancy',
          amount,
          tags: ['foreign-capped'],
          conditions: { [REMITTED]: remitted },
          ...(foreignTax ? { foreignTax } : {}),
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// STEP 7 — the three credits, each retained separately
// ---------------------------------------------------------------------------

describe('credits [docs/spec/calculation-engine.md step 7]', () => {
  it('subtracts APIT and AIT, keeping each readable against its own certificate', () => {
    // Salary 5,000,000; relief 1,800,000; taxable 3,200,000; gross 672,000 (P04).
    const result = computeTax(
      { ...salaryOf(5_000_000), creditsPaid: { apit: 400_000, ait: 50_000 } },
      realYear(),
    );

    expect(result.grossTax).toBe(672_000);
    expect(result.credits).toEqual({
      apit: 400_000,
      ait: 50_000,
      foreign: 0,
      total: 450_000,
      excess: 0,
    });
    expect(result.taxPayable).toBe(222_000);
    // The separate lines are the point: a taxpayer checks each against a certificate.
    expect(result.credits.apit + result.credits.ait).toBe(result.credits.total);
    expect(result.grossTax - result.credits.total).toBe(result.taxPayable);
  });

  it('treats an absent creditsPaid as nil, without inventing a deduction at source', () => {
    const result = computeTax(salaryOf(5_000_000), realYear());
    expect(result.credits).toEqual({
      apit: 0,
      ait: 0,
      foreign: 0,
      total: 0,
      excess: 0,
    });
    expect(result.taxPayable).toBe(672_000);
  });

  it('surfaces excess credit instead of flooring it away', () => {
    // 750,000 of credit against 672,000 of gross tax. The taxpayer is 78,000 in hand,
    // and that figure must survive the max(0, ...) floor on taxPayable.
    const result = computeTax(
      { ...salaryOf(5_000_000), creditsPaid: { apit: 700_000, ait: 50_000 } },
      realYear(),
    );

    expect(result.grossTax).toBe(672_000);
    expect(result.credits.total).toBe(750_000);
    expect(result.taxPayable).toBe(0);
    expect(result.credits.excess).toBe(78_000);
    // Both together, always: taxPayable 0 alone is indistinguishable from "no tax due".
    expect(result.credits.excess).not.toBe(0);

    const warning = result.warnings.find((w) => w.code === 'excess-credit');
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toMatch(/Q20/);
    expect(warning?.message).toMatch(/refundable or carried forward/);
  });

  it('reports no excess when credits exactly equal the gross tax', () => {
    const result = computeTax(
      { ...salaryOf(5_000_000), creditsPaid: { apit: 672_000 } },
      realYear(),
    );
    expect(result.taxPayable).toBe(0);
    expect(result.credits.excess).toBe(0);
    expect(result.warnings.map((w) => w.code)).not.toContain('excess-credit');
  });

  it('rejects a float or negative credit rather than rounding it', () => {
    expect(() =>
      computeTax({ ...salaryOf(5_000_000), creditsPaid: { apit: 0.5 } }, realYear()),
    ).toThrow(/integer rupees, never a float/);
    expect(() =>
      computeTax({ ...salaryOf(5_000_000), creditsPaid: { ait: -1 } }, realYear()),
    ).toThrow(/non-negative/);
  });
});

// ---------------------------------------------------------------------------
// THE FOREIGN TAX CREDIT — per source, capped at the average Sri Lankan rate
// ---------------------------------------------------------------------------

describe('the foreign tax credit is capped at the average Sri Lankan rate [IRA s.81(1)]', () => {
  it('caps the credit at the Sri Lankan tax on that source when the foreign rate is higher', () => {
    // 5,000,000 of remitted foreign consultancy. Sri Lankan tax on it is 390,000 (P05:
    // the ladder capped at 15%), an average rate of 7.8% on the 5,000,000 gross. Foreign
    // tax paid at 25% is 1,250,000 — far more than Sri Lanka charged on the same income.
    const result = computeTax(
      consultancy(5_000_000, { paid: 1_250_000, paidOn: PAID_IN_WINDOW }),
      realYear(),
    );

    expect(result.grossTax).toBe(390_000);
    expect(result.credits.foreign).toBe(390_000);
    // Not the foreign tax actually paid: the credit is limited to the Sri Lankan tax on
    // that income, so the balance is simply not relieved here.
    expect(result.credits.foreign).not.toBe(1_250_000);
    expect(result.credits).toEqual({
      apit: 0,
      ait: 0,
      foreign: 390_000,
      total: 390_000,
      excess: 0,
    });
    expect(result.taxPayable).toBe(0);
    // Capping is not the same as excess credit: nothing is in hand, the credit was
    // limited before it was ever counted.
    expect(result.credits.excess).toBe(0);

    const warning = result.warnings.find((w) => w.code === 'foreign-credit-capped');
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toMatch(/Overseas consultancy/);
    expect(warning?.message).toMatch(/860,?000|860000/); // 1,250,000 - 390,000 unrelieved
  });

  it('passes a foreign tax below the cap through in full', () => {
    const result = computeTax(
      consultancy(5_000_000, { paid: 200_000, paidOn: PAID_IN_WINDOW }),
      realYear(),
    );

    expect(result.grossTax).toBe(390_000);
    expect(result.credits.foreign).toBe(200_000);
    expect(result.taxPayable).toBe(190_000);
    expect(result.warnings.map((w) => w.code)).not.toContain('foreign-credit-capped');
  });

  it('caps against the rate the source ACTUALLY bore, not the one it might have had', () => {
    // The same 5,000,000 and the same foreign tax, with the remittance condition not met:
    // the income runs the full ladder to 36% and bears 672,000 of Sri Lankan tax, so the
    // cap rises with it. A credit capped against the wrong pool would still say 390,000.
    const result = computeTax(
      consultancy(5_000_000, { paid: 1_250_000, paidOn: PAID_IN_WINDOW }, false),
      realYear(),
    );

    expect(result.grossTax).toBe(672_000);
    expect(result.credits.foreign).toBe(672_000);
    expect(result.credits.foreign).not.toBe(390_000);
    expect(result.taxPayable).toBe(0);
  });

  it('gives no credit where the Sri Lankan tax on that source is nil', () => {
    // Income below the relief threshold bears no Sri Lankan tax, so the average rate
    // applied to it is nil and there is nothing for a foreign credit to be set against.
    const result = computeTax(
      consultancy(1_500_000, { paid: 300_000, paidOn: PAID_IN_WINDOW }),
      realYear(),
    );

    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
    expect(result.credits.foreign).toBe(0);
    expect(result.credits.excess).toBe(0);
  });
});

describe('the foreign tax credit is computed per source [IRA s.81(1)]', () => {
  /**
   * Two foreign sources of the same size, one taxed abroad above the Sri Lankan average
   * rate and one below. This is the assertion an aggregate implementation cannot survive.
   *
   * Employment 3,000,000 + 3,000,000 = 6,000,000; relief 1,800,000; taxable 4,200,000.
   * Ladder: 60,000 + 90,000 + 120,000 + 150,000 + 1,700,000 @ 36% = 1,032,000.
   * Average rate applied to each source: 1,032,000 x 3,000,000 / 6,000,000 = 516,000 each.
   *
   *   per source  : min(800,000, 516,000) + min(100,000, 516,000) = 616,000
   *   aggregated  : min(900,000, 1,032,000)                       = 900,000
   *
   * The aggregate answer relieves 284,000 of Berlin's excess tax against Sri Lankan tax on
   * the Nairobi source, which is exactly what capping each source separately prevents.
   */
  const twoSources: TaxInput = {
    residency: 'resident',
    income: {
      employment: [
        {
          label: 'Berlin contract',
          amount: 3_000_000,
          foreignTax: { paid: 800_000, paidOn: PAID_IN_WINDOW },
        },
        {
          label: 'Nairobi contract',
          amount: 3_000_000,
          foreignTax: { paid: 100_000, paidOn: PAID_IN_WINDOW },
        },
      ],
    },
  };

  it('caps each source on its own, so one source never subsidises another', () => {
    const result = computeTax(twoSources, realYear());

    expect(result.taxableMain).toBe(4_200_000);
    expect(result.grossTax).toBe(1_032_000);
    expect(result.credits.foreign).toBe(616_000);
    expect(result.credits.foreign).not.toBe(900_000); // the aggregated answer
    expect(result.taxPayable).toBe(416_000);
  });

  it('names the capped source, and only the capped source, in the warning', () => {
    const result = computeTax(twoSources, realYear());
    const capped = result.warnings.filter((w) => w.code === 'foreign-credit-capped');

    expect(capped).toHaveLength(1);
    expect(capped[0]?.message).toMatch(/Berlin contract/);
    expect(capped[0]?.message).not.toMatch(/Nairobi/);
  });

  it('never credits more than the Sri Lankan tax on the pool the sources were taxed in', () => {
    // Both sources over-taxed abroad: the two caps together must still not exceed the
    // tax actually charged on the pool.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [
            {
              label: 'Berlin contract',
              amount: 3_000_000,
              foreignTax: { paid: 2_000_000, paidOn: PAID_IN_WINDOW },
            },
            {
              label: 'Nairobi contract',
              amount: 3_000_000,
              foreignTax: { paid: 2_000_000, paidOn: PAID_IN_WINDOW },
            },
          ],
        },
      },
      realYear(),
    );

    expect(result.credits.foreign).toBe(1_032_000);
    expect(result.credits.foreign).toBe(result.grossTax);
    expect(result.taxPayable).toBe(0);
    expect(result.credits.excess).toBe(0);
  });

  it('shares the single Fifth Schedule deduction between sources in proportion', () => {
    // One foreign source of 2,000,000 alongside 4,000,000 of domestic salary. The credit
    // must not be capped at the whole 1,032,000 of Sri Lankan tax — most of that tax is
    // on domestic income, and a foreign credit cannot relieve it.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [
            { label: 'Colombo salary', amount: 4_000_000 },
            {
              label: 'Berlin contract',
              amount: 2_000_000,
              foreignTax: { paid: 900_000, paidOn: PAID_IN_WINDOW },
            },
          ],
        },
      },
      realYear(),
    );

    expect(result.grossTax).toBe(1_032_000);
    // 1,032,000 x 2,000,000 / 6,000,000
    expect(result.credits.foreign).toBe(344_000);
    expect(result.credits.foreign).not.toBe(1_032_000);
    expect(result.taxPayable).toBe(688_000);
  });
});

describe('the two-year condition on the foreign tax credit [IRA s.81(2)]', () => {
  // Y/A 2025/2026 ends 31 March 2026, so the window closes on 31 March 2028.
  it('allows a credit paid on the last day of the window', () => {
    const result = computeTax(
      consultancy(5_000_000, { paid: 200_000, paidOn: '2028-03-31' }),
      realYear(),
    );
    expect(result.credits.foreign).toBe(200_000);
    expect(result.warnings.map((w) => w.code)).not.toContain('foreign-credit-time-limit');
  });

  it('disallows a credit paid one day after the window closes', () => {
    const result = computeTax(
      consultancy(5_000_000, { paid: 200_000, paidOn: '2028-04-01' }),
      realYear(),
    );

    expect(result.credits.foreign).toBe(0);
    expect(result.taxPayable).toBe(390_000);

    const warning = result.warnings.find((w) => w.code === 'foreign-credit-time-limit');
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toMatch(/2028-03-31/);
    // It says which way it errs: the taxpayer holds a receipt and owes more, not less.
    expect(warning?.message).toMatch(/higher/);
  });

  it('reads the window from the year of assessment, not from a constant', () => {
    // The same payment date is inside the window for a later year and outside it for an
    // earlier one — the window is two years from THAT year's end.
    const paidOn = '2028-04-01';
    const earlier = computeTax(
      {
        ...salaryOf(5_000_000),
        income: {
          employment: [
            { label: 'S', amount: 5_000_000, foreignTax: { paid: 100_000, paidOn } },
          ],
        },
      },
      makeYear({ startYear: 2025 }), // ends 2026-03-31, window closes 2028-03-31
    );
    const later = computeTax(
      {
        ...salaryOf(5_000_000),
        income: {
          employment: [
            { label: 'S', amount: 5_000_000, foreignTax: { paid: 100_000, paidOn } },
          ],
        },
      },
      makeYear({ startYear: 2026 }), // ends 2027-03-31, window closes 2029-03-31
    );

    expect(earlier.credits.foreign).toBe(0);
    expect(later.credits.foreign).toBe(100_000);
  });

  it('throws on a payment date that is not a real date', () => {
    expect(() =>
      computeTax(
        consultancy(5_000_000, { paid: 200_000, paidOn: '2026-02-30' }),
        realYear(),
      ),
    ).toThrow(/is not a real date/);
    expect(() =>
      computeTax(
        consultancy(5_000_000, { paid: 200_000, paidOn: '31/01/2026' }),
        realYear(),
      ),
    ).toThrow(/expected a date as YYYY-MM-DD/);
  });
});

describe('a foreign gain — "for each gain" [IRA s.81(1)] — KNOWN-UNVERIFIED RATE', () => {
  /**
   * This case's figures depend on `separatelyRated["capital-gain"].rateBp`, which the
   * committed data marks `verified: false`: it is the 2017 rate, superseded by Act No. 11
   * of 2026, which this repository does not hold (Q42). The assertions below are correct
   * for the data as committed and will move when that act is obtained. The engine's own
   * `unverified-rate` warning is asserted alongside them so the flag cannot be read
   * separately from the figure.
   */
  const salaryAndGain: TaxInput = {
    residency: 'resident',
    income: {
      employment: [{ label: 'Salary', amount: 5_000_000 }],
      investment: [
        {
          label: 'Sale of a Melbourne flat',
          amount: 1_000_000,
          tags: ['capital-gain'],
          foreignTax: { paid: 400_000, paidOn: PAID_IN_WINDOW },
        },
      ],
    },
  };

  it('caps the credit for a gain at the tax on THAT gain, not at the total tax', () => {
    const result = computeTax(salaryAndGain, realYear());

    // Relief never reaches the gain: taxable main 3,200,000, taxable gain 1,000,000.
    expect(result.taxableMain).toBe(3_200_000);
    expect(result.taxableGain).toBe(1_000_000);
    expect(result.components.find((c) => c.kind === 'ladder')?.tax).toBe(672_000);
    expect(result.components.find((c) => c.kind === 'capital-gain')?.tax).toBe(100_000);
    expect(result.grossTax).toBe(772_000);

    // The credit is capped at the 100,000 charged on the gain — not at the 400,000 paid
    // abroad, and not at the 772,000 of tax the taxpayer bears overall.
    expect(result.credits.foreign).toBe(100_000);
    expect(result.credits.foreign).not.toBe(400_000);
    expect(result.credits.foreign).not.toBe(772_000);
    expect(result.taxPayable).toBe(672_000);
  });

  it('carries the unverified-rate warning for the rate the cap was computed from', () => {
    const result = computeTax(salaryAndGain, realYear());
    const unverified = result.warnings.filter((w) => w.code === 'unverified-rate');
    expect(unverified).toHaveLength(1);
    expect(unverified[0]?.message).toMatch(/capital-gain/);
  });
});

describe('foreign tax that cannot be attributed to a source', () => {
  it('refuses an aggregate creditsPaid.foreign rather than crediting it uncapped', () => {
    expect(() =>
      computeTax(
        { ...salaryOf(5_000_000), creditsPaid: { foreign: 300_000 } },
        realYear(),
      ),
    ).toThrow(/separately for each source and for each gain/);
  });

  it('stops rather than apportion a head deduction across a source with foreign tax', () => {
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: {
            business: [
              {
                label: 'Overseas consultancy',
                amount: 5_000_000,
                foreignTax: { paid: 200_000, paidOn: PAID_IN_WINDOW },
              },
            ],
          },
          deductions: { business: 400_000 },
        },
        realYear(),
      ),
    ).toThrow(/will not guess/);
  });

  it('rejects a float amount of foreign tax', () => {
    expect(() =>
      computeTax(
        consultancy(5_000_000, { paid: 200_000.5, paidOn: PAID_IN_WINDOW }),
        realYear(),
      ),
    ).toThrow(/integer rupees, never a float/);
  });
});

// ---------------------------------------------------------------------------
// THE REFUSAL STILL PRODUCES NOTHING — even with credits and an estimate to hand
// ---------------------------------------------------------------------------

describe('a Q14 refusal computes neither credits nor a schedule', () => {
  const mixed: TaxInput = {
    residency: 'resident',
    income: {
      business: [
        {
          label: 'Overseas consultancy',
          amount: 4_000_000,
          tags: ['foreign-capped'],
          conditions: { [REMITTED]: true },
          foreignTax: { paid: 500_000, paidOn: PAID_IN_WINDOW },
        },
      ],
      employment: [{ label: 'Local salary', amount: 2_000_000 }],
    },
    creditsPaid: { apit: 300_000, ait: 25_000 },
    estimatedTaxForInstalments: 900_000,
  };

  it('returns zeroed placeholders, not a credited nil and not a schedule', () => {
    const result = computeTax(mixed, realYear());

    expect(isRefusal(result)).toBe(true);
    // The APIT the taxpayer actually paid is NOT reported as a credit: there is no gross
    // tax for it to be credited against, and a credit line beside a refusal reads as a
    // computation that happened.
    expect(result.credits).toEqual({ apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 });
    expect(result.schedule).toEqual({
      instalments: [],
      finalPayment: { due: '', amount: 0 },
      returnDue: '',
    });
    expect(result.taxPayable).toBe(0);
  });

  it('does not even derive the return due date on a refusal', () => {
    // Derivable from the year alone, and deliberately withheld: a date beside a refusal
    // invites the reading that a figure was produced.
    expect(computeTax(mixed, realYear()).schedule.returnDue).toBe('');
  });
});

// ---------------------------------------------------------------------------
// STEP 8 — the instalment formula, (A - C) / B
// ---------------------------------------------------------------------------

describe('instalments follow the formula on the estimate [IRA s.90(3)]', () => {
  it('walks the four real dates, in order, with their quarters', () => {
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000 },
      realYear(),
    );

    expect(result.schedule.instalments).toEqual([
      { quarter: 1, due: '2025-08-15', amount: 150_000 },
      { quarter: 2, due: '2025-11-15', amount: 150_000 },
      { quarter: 3, due: '2026-02-15', amount: 150_000 },
      { quarter: 4, due: '2026-05-15', amount: 150_000 },
    ]);
  });

  it('THE FOURTH INSTALMENT FALLS IN THE FOLLOWING YEAR OF ASSESSMENT', () => {
    // A model that assumes four dates inside the year is wrong [IRA s.90(2)(a)].
    const year = realYear();
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000 },
      year,
    );
    const fourth = result.schedule.instalments[3];

    expect(year.period.to).toBe('2026-03-31');
    expect(fourth?.due).toBe('2026-05-15');
    // After the year of assessment has ended — 45 days after, in the following one.
    expect(fourth?.due.localeCompare(year.period.to)).toBe(1);
    expect(
      result.schedule.instalments.filter((i) => i.due > year.period.to),
    ).toHaveLength(1);
    expect(
      result.schedule.instalments.filter((i) => i.due <= year.period.to),
    ).toHaveLength(3);
  });

  it('is NOT a flat quarter each: the residue lands on the last instalment', () => {
    // An estimate of 10 rupees. (A - C) / B gives 2, 2, 3, 3 — a flat quarter gives
    // 2, 2, 2, 2 and quietly loses two rupees of the estimate.
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 10 },
      realYear(),
    );

    expect(result.schedule.instalments.map((i) => i.amount)).toEqual([2, 2, 3, 3]);
    expect(result.schedule.instalments.map((i) => i.amount)).not.toEqual([2, 2, 2, 2]);
    expect(result.schedule.instalments.reduce((n, i) => n + i.amount, 0)).toBe(10);
  });

  it('sums the instalments to the estimate exactly, for awkward estimates', () => {
    const cases: [estimate: number, amounts: number[]][] = [
      [1_000_000, [250_000, 250_000, 250_000, 250_000]],
      [1_000_001, [250_000, 250_000, 250_000, 250_001]],
      [999_999, [249_999, 250_000, 250_000, 250_000]],
      [7, [1, 2, 2, 2]],
      [3, [0, 1, 1, 1]],
      [1, [0, 0, 0, 1]],
      [0, [0, 0, 0, 0]],
    ];

    for (const [estimate, amounts] of cases) {
      const result = computeTax(
        { ...salaryOf(5_000_000), estimatedTaxForInstalments: estimate },
        realYear(),
      );
      expect(
        result.schedule.instalments.map((i) => i.amount),
        `estimate ${estimate}`,
      ).toEqual(amounts);
      expect(result.schedule.instalments.reduce((n, i) => n + i.amount, 0)).toBe(
        estimate,
      );
    }
  });

  it('takes B from the data, not from a hardcoded four', () => {
    // A year declaring three instalments walks B = 3, 2, 1: 33, 33, 34 on an estimate
    // of 100. Four hardcoded instalments cannot produce this.
    const year = makeYear({
      instalments: [
        { quarter: 1, due: '2025-08-15', src: 'test-src' },
        { quarter: 2, due: '2025-11-15', src: 'test-src' },
        { quarter: 3, due: '2026-02-15', src: 'test-src' },
      ],
    });
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 100 },
      year,
    );

    expect(result.schedule.instalments.map((i) => [i.quarter, i.amount])).toEqual([
      [1, 33],
      [2, 33],
      [3, 34],
    ]);
  });

  it('stops rather than accumulate C against an out-of-order calendar', () => {
    const year = makeYear({
      instalments: [
        { quarter: 1, due: '2025-11-15', src: 'test-src' },
        { quarter: 2, due: '2025-08-15', src: 'test-src' },
        { quarter: 3, due: '2026-02-15', src: 'test-src' },
        { quarter: 4, due: '2026-05-15', src: 'test-src' },
      ],
    });
    expect(() =>
      computeTax({ ...salaryOf(5_000_000), estimatedTaxForInstalments: 100 }, year),
    ).toThrow(/not in ascending date order/);
  });

  it('rejects a float or negative estimate', () => {
    expect(() =>
      computeTax(
        { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000.5 },
        realYear(),
      ),
    ).toThrow(/integer rupees, never a float/);
    expect(() =>
      computeTax({ ...salaryOf(5_000_000), estimatedTaxForInstalments: -1 }, realYear()),
    ).toThrow(/non-negative/);
  });

  it('produces no instalments, and no schedule warnings, when no estimate is given', () => {
    const result = computeTax(salaryOf(5_000_000), realYear());

    expect(result.schedule.instalments).toEqual([]);
    expect(result.schedule.finalPayment).toEqual({ due: '', amount: 0 });
    // The filing deadline still derives: it depends on nothing but the year.
    expect(result.schedule.returnDue).toBe('2026-11-30');
    // A is the taxpayer's own estimate [IRA s.90(3)]; the engine does not substitute the
    // liability it computed for it, and says nothing rather than something invented.
    expect(result.warnings).toEqual([]);
    expect(result.taxPayable).toBe(672_000);
  });
});

// ---------------------------------------------------------------------------
// THE FINAL PAYMENT — where the estimate and the liability are reconciled
// ---------------------------------------------------------------------------

describe('the final payment reconciles the estimate to the computed liability', () => {
  /**
   * THE ESTIMATE-DIFFERS-FROM-LIABILITY CASE, in full.
   *
   * A consultant with 8,000,000 of income who estimated 900,000 in April and finds the
   * year came in higher.
   *
   *   assessable        8,000,000
   *   relief            1,800,000  [IRA s.52(1), Sch.5 para 2(a)(v)]
   *   taxable           6,200,000
   *   ladder tax        60,000 + 90,000 + 120,000 + 150,000 + 3,700,000 @ 36%
   *                   = 1,752,000
   *   APIT credit         200,000
   *   tax payable       1,552,000
   *
   *   estimate (A)        900,000   <- drives the instalments, and ONLY the instalments
   *   instalments       225,000 x 4 = 900,000
   *   final payment       652,000   = 1,552,000 - 900,000
   *
   * The instalments are computed from the estimate and are unaffected by the liability;
   * the final payment carries the whole difference. An engine that quartered the
   * liability would show 388,000 an instalment and nothing to settle at the end.
   */
  const underEstimated: TaxInput = {
    ...salaryOf(8_000_000),
    creditsPaid: { apit: 200_000 },
    estimatedTaxForInstalments: 900_000,
  };

  it('drives the instalments from the estimate and the final payment from the liability', () => {
    const result = computeTax(underEstimated, realYear());

    expect(result.taxableMain).toBe(6_200_000);
    expect(result.grossTax).toBe(1_752_000);
    expect(result.credits.total).toBe(200_000);
    expect(result.taxPayable).toBe(1_552_000);

    expect(result.schedule.instalments).toEqual([
      { quarter: 1, due: '2025-08-15', amount: 225_000 },
      { quarter: 2, due: '2025-11-15', amount: 225_000 },
      { quarter: 3, due: '2026-02-15', amount: 225_000 },
      { quarter: 4, due: '2026-05-15', amount: 225_000 },
    ]);
    // Not a quarter of the liability, which would be 388,000.
    expect(result.schedule.instalments[0]?.amount).not.toBe(388_000);

    expect(result.schedule.finalPayment.amount).toBe(652_000);
    expect(
      result.schedule.instalments.reduce((n, i) => n + i.amount, 0) +
        result.schedule.finalPayment.amount,
    ).toBe(result.taxPayable);
  });

  it('states no date for the final payment, because Q22 is unresolved', () => {
    const result = computeTax(underEstimated, realYear());

    expect(result.schedule.finalPayment.due).toBe('');
    const warning = result.warnings.find(
      (w) => w.code === 'final-payment-date-unresolved',
    );
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toMatch(/Q22/);
    // The filing deadline is stated, and distinguished from a payment deadline.
    expect(warning?.message).toMatch(/2026-11-30/);
    expect(warning?.message).toMatch(/filing deadline is not necessarily/);
  });

  it('shows an over-estimate as a negative final payment rather than hiding it', () => {
    // The same taxpayer, having estimated 2,000,000 against a liability of 1,552,000.
    const result = computeTax(
      { ...underEstimated, estimatedTaxForInstalments: 2_000_000 },
      realYear(),
    );

    expect(result.taxPayable).toBe(1_552_000);
    expect(result.schedule.instalments.map((i) => i.amount)).toEqual([
      500_000, 500_000, 500_000, 500_000,
    ]);
    expect(result.schedule.finalPayment.amount).toBe(-448_000);
    // Clamping this at zero would break the reconciliation and hide an overpayment.
    expect(result.schedule.finalPayment.amount).not.toBe(0);
    expect(
      result.schedule.instalments.reduce((n, i) => n + i.amount, 0) +
        result.schedule.finalPayment.amount,
    ).toBe(result.taxPayable);

    const warning = result.warnings.find((w) => w.code === 'estimate-exceeds-liability');
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toMatch(/overpayment of 448000/);
    expect(result.warnings.map((w) => w.code)).not.toContain(
      'final-payment-date-unresolved',
    );
  });

  it('reconciles to the liability AFTER credits, not to the gross tax', () => {
    const withCredits = computeTax(
      {
        ...salaryOf(5_000_000),
        creditsPaid: { apit: 400_000, ait: 50_000 },
        estimatedTaxForInstalments: 100_000,
      },
      realYear(),
    );

    expect(withCredits.grossTax).toBe(672_000);
    expect(withCredits.taxPayable).toBe(222_000);
    // 222,000 - 100,000 of instalments, not 672,000 - 100,000.
    expect(withCredits.schedule.finalPayment.amount).toBe(122_000);
    expect(withCredits.schedule.finalPayment.amount).not.toBe(572_000);
  });

  it('settles the whole liability at the end when the estimate was nil', () => {
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 0 },
      realYear(),
    );
    expect(result.schedule.instalments.map((i) => i.amount)).toEqual([0, 0, 0, 0]);
    expect(result.schedule.finalPayment.amount).toBe(672_000);
  });
});

// ---------------------------------------------------------------------------
// THE RECONCILIATION PROPERTY — over a sweep of awkward amounts
// ---------------------------------------------------------------------------

describe('instalments plus the final payment sum exactly to the liability', () => {
  // fast-check is not a dependency (see package.json), so this is a deterministic
  // pseudo-random sweep: a fixed seed means a failure is reproducible.
  function lcg(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state;
    };
  }

  it('holds for 2000 awkward (income, estimate, credit) combinations', () => {
    const next = lcg(20260515);
    const year = realYear();

    for (let i = 0; i < 2000; i++) {
      // Deliberately non-round: primes and odd multipliers, so nothing divides by four.
      const income = (next() % 19_999_999) + 1;
      const estimate = (next() % 3_333_331) + 1;
      const apit = next() % 777_773;

      const result = computeTax(
        {
          ...salaryOf(income),
          creditsPaid: { apit },
          estimatedTaxForInstalments: estimate,
        },
        year,
      );

      const instalments = result.schedule.instalments;
      const paid = instalments.reduce((n, x) => n + x.amount, 0);
      const where = `income ${income}, estimate ${estimate}, apit ${apit}`;

      // Every figure is an exact integer number of rupees.
      for (const instalment of instalments) {
        expect(Number.isSafeInteger(instalment.amount), where).toBe(true);
        expect(instalment.amount, where).toBeGreaterThanOrEqual(0);
      }
      expect(Number.isSafeInteger(result.schedule.finalPayment.amount), where).toBe(true);

      // The instalments settle the estimate, to the rupee.
      expect(paid, where).toBe(estimate);
      // The schedule as a whole settles the LIABILITY, to the rupee.
      expect(paid + result.schedule.finalPayment.amount, where).toBe(result.taxPayable);
      // And the liability is still gross tax less credits, floored at zero.
      expect(result.taxPayable, where).toBe(
        Math.max(0, result.grossTax - result.credits.total),
      );
      expect(result.credits.excess, where).toBe(
        Math.max(0, result.credits.total - result.grossTax),
      );
    }
  });

  it('holds when the foreign credit is in play too', () => {
    const next = lcg(20250815);
    const year = realYear();

    for (let i = 0; i < 500; i++) {
      const income = (next() % 9_999_991) + 1_800_001;
      const foreignPaid = next() % 2_222_221;
      const estimate = next() % 1_111_111;

      const result = computeTax(
        {
          residency: 'resident',
          income: {
            business: [
              {
                label: 'Overseas consultancy',
                amount: income,
                tags: ['foreign-capped'],
                conditions: { [REMITTED]: true },
                foreignTax: { paid: foreignPaid, paidOn: PAID_IN_WINDOW },
              },
            ],
          },
          estimatedTaxForInstalments: estimate,
        },
        year,
      );

      const where = `income ${income}, foreign ${foreignPaid}, estimate ${estimate}`;
      const paid = result.schedule.instalments.reduce((n, x) => n + x.amount, 0);

      expect(paid + result.schedule.finalPayment.amount, where).toBe(result.taxPayable);
      // The credit never exceeds the Sri Lankan tax on that income, so a single-source
      // taxpayer can never generate excess credit out of a foreign credit alone.
      expect(result.credits.foreign, where).toBeLessThanOrEqual(result.grossTax);
      expect(result.credits.excess, where).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// THE RETURN DUE DATE — derived, with calendar month arithmetic
// ---------------------------------------------------------------------------

describe('the return due date is derived, never stored [IRA s.93(1)]', () => {
  it('derives 30 November 2026 for the real Y/A 2025/2026 data', () => {
    // period.to 2026-03-31 plus the data's monthsAfterYearEnd of 8. November has 30 days,
    // so the day-of-month clamps: "31 November" is not a date.
    const result = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000 },
      realYear(),
    );
    expect(realYear().calendar.returnDueRule.monthsAfterYearEnd).toBe(8);
    expect(result.schedule.returnDue).toBe('2026-11-30');
  });

  it('follows the data when the number of months moves', () => {
    for (const [months, expected] of [
      [1, '2026-04-30'],
      [6, '2026-09-30'],
      [8, '2026-11-30'],
      [9, '2026-12-31'],
      [10, '2027-01-31'],
      [12, '2027-03-31'],
      [23, '2028-02-29'], // 2028 is a leap year
    ] as [number, string][]) {
      const result = computeTax(
        salaryOf(5_000_000),
        makeYear({ monthsAfterYearEnd: months }),
      );
      expect(result.schedule.returnDue, `${months} months`).toBe(expected);
    }
  });

  it('LEAP YEAR: the same rule gives 29 February in 2028 and 28 February in 2027', () => {
    // Two years of assessment differing only in which calendar year they end in, both
    // with an eleven-month filing rule. 31 March + 11 months lands in February, whose
    // length is the thing a naive "add 30 days a month" or "always the 28th" gets wrong.
    const endsIn2026 = computeTax(
      salaryOf(5_000_000),
      makeYear({ startYear: 2025, monthsAfterYearEnd: 11 }), // period.to 2026-03-31
    );
    const endsIn2027 = computeTax(
      salaryOf(5_000_000),
      makeYear({ startYear: 2026, monthsAfterYearEnd: 11 }), // period.to 2027-03-31
    );

    expect(endsIn2026.schedule.returnDue).toBe('2027-02-28');
    expect(endsIn2027.schedule.returnDue).toBe('2028-02-29');
  });
});

describe('addMonthsToIsoDate — the month-end clamp rule', () => {
  /**
   * Asserted directly because the tax-year schema requires `period.to` to be 31 March, so
   * the February and short-month edges cannot be reached through a schema-valid data file.
   * An untestable rule is an unverified one.
   *
   * The rule: advance the month, hold the day, and where the target month is too short,
   * take its last day. A month-end stays a month-end.
   */
  const cases: [iso: string, months: number, expected: string, why: string][] = [
    ['2026-03-31', 8, '2026-11-30', 'the real case: 31 March + 8 months'],
    ['2026-03-31', 0, '2026-03-31', 'adding nothing changes nothing'],
    ['2025-01-31', 1, '2025-02-28', '31 January + 1 month, ordinary year'],
    ['2024-01-31', 1, '2024-02-29', '31 January + 1 month, LEAP year'],
    ['2023-01-31', 1, '2023-02-28', 'the same date one year earlier, not a leap year'],
    [
      '2024-02-29',
      12,
      '2025-02-28',
      '29 February + 1 year has no 29 February to land on',
    ],
    ['2024-02-29', 48, '2028-02-29', '29 February + 4 years does'],
    ['2000-02-29', 12, '2001-02-28', '2000 is a leap year: divisible by 400'],
    ['1900-02-28', 12, '1901-02-28', '1900 is NOT a leap year: a century, not a 400'],
    ['2025-12-31', 8, '2026-08-31', 'crossing a year boundary'],
    ['2025-12-31', 24, '2027-12-31', 'crossing two'],
    ['2026-05-31', 1, '2026-06-30', '31 May + 1 month, a 30-day month'],
    ['2026-01-30', 1, '2026-02-28', 'a day that is not a month end still clamps'],
    ['2026-01-15', 1, '2026-02-15', 'a mid-month day is simply carried'],
  ];

  for (const [iso, months, expected, why] of cases) {
    it(`${iso} + ${months} months = ${expected} (${why})`, () => {
      expect(addMonthsToIsoDate(iso, months)).toBe(expected);
    });
  }

  it('never returns a date that does not exist', () => {
    for (let months = 0; months <= 60; months++) {
      for (const iso of ['2024-01-31', '2024-02-29', '2025-08-31', '2026-03-31']) {
        const out = addMonthsToIsoDate(iso, months);
        expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Round-tripping through the parser is the check: it rejects 31 November.
        expect(addMonthsToIsoDate(out, 0)).toBe(out);
      }
    }
  });

  it('rejects a malformed date or a fractional number of months', () => {
    expect(() => addMonthsToIsoDate('2026-3-31', 8)).toThrow(/expected a date/);
    expect(() => addMonthsToIsoDate('2026-13-01', 8)).toThrow(/has no month 13/);
    expect(() => addMonthsToIsoDate('2026-02-30', 8)).toThrow(/not a real date/);
    expect(() => addMonthsToIsoDate('2026-03-31', 1.5)).toThrow(/whole number/);
  });
});

// ---------------------------------------------------------------------------
// Year scoping, provenance and purity for the new code paths
// ---------------------------------------------------------------------------

describe('the schedule is resolved only from the taxYear argument', () => {
  it('computes each year from its own calendar, with no cross-talk', () => {
    const y2025 = makeYear({ startYear: 2025 });
    const y2026 = makeYear({ startYear: 2026 });
    const input = { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000 };

    const before = computeTax(input, y2025);
    computeTax(input, y2026);
    const after = computeTax(input, y2025);

    expect(after).toEqual(before);
    expect(before.schedule.instalments[0]?.due).toBe('2025-08-15');
    expect(before.schedule.returnDue).toBe('2026-11-30');
    expect(computeTax(input, y2026).schedule.instalments[0]?.due).toBe('2026-08-15');
    expect(computeTax(input, y2026).schedule.returnDue).toBe('2027-11-30');
  });

  it('records the calendar sources it used, once a schedule exists', () => {
    const withSchedule = computeTax(
      { ...salaryOf(5_000_000), estimatedTaxForInstalments: 600_000 },
      realYear(),
    );
    expect(withSchedule.sourcesUsed).toContain('ira-2017#s.90(2)(a)');
    expect(withSchedule.sourcesUsed).toContain('ira-2017#s.93(1)');
  });

  it('does not mutate its arguments', () => {
    const input: TaxInput = {
      ...salaryOf(5_000_000),
      creditsPaid: { apit: 100_000 },
      estimatedTaxForInstalments: 600_000,
    };
    const year = realYear();
    const inputBefore = structuredClone(input);
    const yearBefore = structuredClone(year);
    computeTax(input, year);
    expect(input).toEqual(inputBefore);
    expect(year).toEqual(yearBefore);
  });

  it('returns an identical result for identical arguments', () => {
    const input: TaxInput = {
      ...consultancy(5_000_000, { paid: 1_250_000, paidOn: PAID_IN_WINDOW }),
      creditsPaid: { apit: 10_000 },
      estimatedTaxForInstalments: 123_457,
    };
    expect(computeTax(input, realYear())).toEqual(computeTax(input, realYear()));
  });
});

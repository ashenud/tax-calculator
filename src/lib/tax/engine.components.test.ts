/**
 * Engine part 2 — the separately-rated components, the maximum-rate cap, and the Q14
 * refusal. `engine.test.ts` (P04) owns the partition, the deduction and the plain ladder
 * and is deliberately left untouched; this file only exercises what P04 stubbed.
 *
 * Three assertions here are the reason the file exists, and each was written as a
 * failing-before-fixing test against the plausible wrong implementation:
 *
 *   - **the cap is a cap, not a table.** `describe('the cap is a cap on the ladder')`
 *     moves a band rate and a band width in a synthetic fixture and watches the capped
 *     answer move with them. A hardcoded "first Rs. 1,000,000 at 6%, balance at 15%"
 *     table passes the pure-15%-data case and fails every one of those.
 *   - **the mixed case refuses.** No number for it exists anywhere in this file, by
 *     construction: the only assertions on the mixed case are that there is no figure.
 *   - **relief never reaches the gain**, which P04 proved for the partition and this file
 *     re-proves now that the gain is actually rated.
 *
 * Assertions are field by field, never on `taxPayable` alone: a total-only assertion lets
 * two compensating errors through. Expected figures are arithmetic a reader can check
 * against the band table in the fixture itself, or against the tables quoted in
 * `docs/research/09-terminal-benefits.md`.
 */

import { describe, expect, it } from 'vitest';
import {
  assertWithinCap,
  computeTax,
  isRefusal,
  walkBands,
  type TaxInput,
  type TaxYearData,
} from './engine';
import { loadTaxYears } from './load';
import { taxYearFileSchema } from './schema';

// ---------------------------------------------------------------------------
// The real Y/A 2025/2026 data — the acceptance criteria are stated against it
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

// ---------------------------------------------------------------------------
// Synthetic fixtures — for the invariants the real data cannot express
// ---------------------------------------------------------------------------

interface DraftBand {
  width: number | null;
  rateBp: number;
  src: string;
}

/** A deliberately short ladder, so a hand-check of a capped walk is three lines long. */
const SHORT_LADDER: DraftBand[] = [
  { width: 1_000_000, rateBp: 600, src: 'test-src' },
  { width: 500_000, rateBp: 1800, src: 'test-src' },
  { width: null, rateBp: 3600, src: 'test-src' },
];

interface SyntheticOptions {
  bands?: DraftBand[];
  maxRateBp?: number;
  /** Condition ids the cap turns on. Empty (the default) = the cap applies outright. */
  capConditions?: string[];
  noCap?: boolean;
  capVerified?: boolean;
  extraCap?: boolean;
}

/** Built through the real Zod schema, so a synthetic fixture can never assert behaviour
 * on data the loader would have rejected. Relief is nil here: these fixtures are about
 * the rate applied to an amount, and a relief in the way only obscures the arithmetic. */
function makeCappedYear(opts: SyntheticOptions = {}): TaxYearData {
  const conditions = opts.capConditions ?? [];

  return taxYearFileSchema.parse({
    schemaVersion: 1,
    yearOfAssessment: '2025/2026',
    period: { from: '2025-04-01', to: '2026-03-31' },
    status: 'enacted',
    lastReviewed: '2026-03-31',
    sources: {
      'test-src': {
        title: 'Synthetic fixture source — not a citation, unit test data only',
        file: 'docs/sources/SYNTHETIC-TEST-FIXTURE',
      },
    },
    reliefs: {},
    qualifyingPayments: [],
    rateSchedules: {
      'individual-normal': {
        label: 'Synthetic individual ladder',
        verified: true,
        bands: opts.bands ?? SHORT_LADDER,
      },
    },
    rateCaps: opts.noCap
      ? {}
      : {
          'test-cap': {
            label: 'Synthetic maximum rate',
            appliesToSchedule: 'individual-normal',
            maxRateBp: opts.maxRateBp ?? 1500,
            conditions,
            verified: opts.capVerified ?? true,
            src: 'test-src',
          },
          ...(opts.extraCap
            ? {
                'second-cap': {
                  label: 'A second cap on the same schedule',
                  appliesToSchedule: 'individual-normal',
                  maxRateBp: 2000,
                  conditions: [],
                  verified: true,
                  src: 'test-src',
                },
              }
            : {}),
        },
    conditions: Object.fromEntries(
      conditions.map((id) => [
        id,
        {
          question: `Synthetic condition ${id}?`,
          ifNotMet: null,
          evidence: 'Synthetic fixture',
          src: 'test-src',
        },
      ]),
    ),
    separatelyRated: {},
    apit: { tables: [], src: 'test-src' },
    wht: {},
    calendar: {
      instalments: [{ quarter: 1, due: '2025-08-15', src: 'test-src' }],
      returnDueRule: { monthsAfterYearEnd: 8, src: 'test-src' },
    },
  });
}

/** A whole tax year of foreign-currency consultancy, all of it remitted. */
function cappedIncome(amount: number, met = true, conditionId = REMITTED): TaxInput {
  return {
    residency: 'resident',
    income: {
      business: [
        {
          label: 'Overseas consultancy',
          amount,
          tags: ['foreign-capped'],
          conditions: { [conditionId]: met },
        },
      ],
    },
  };
}

/** The same, but for the synthetic fixtures, whose cap has no conditions by default. */
function syntheticCapped(amount: number): TaxInput {
  return {
    residency: 'resident',
    income: {
      business: [{ label: 'Overseas consultancy', amount, tags: ['foreign-capped'] }],
    },
  };
}

// ---------------------------------------------------------------------------
// THE CAP IS A CAP ON THE LADDER, NOT A TWO-BAND TABLE
// ---------------------------------------------------------------------------

describe('the cap is a cap on the ladder [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]', () => {
  // Baseline, from the synthetic ladder 1,000,000 @ 6% | 500,000 @ 18% | balance @ 36%,
  // capped at 15%. Taxable 2,000,000:
  //   1,000,000 @ min(6%,15%)  = 6%  ->  60,000
  //     500,000 @ min(18%,15%) = 15% ->  75,000
  //     500,000 @ min(36%,15%) = 15% ->  75,000
  //                                     -------
  //                                      210,000
  it('caps each band at min(bandRateBp, maxRateBp) and records both rates', () => {
    const result = computeTax(syntheticCapped(2_000_000), makeCappedYear());
    const capped = result.components.find((c) => c.kind === 'capped');

    expect(capped).toEqual({
      kind: 'capped',
      amount: 2_000_000,
      conditionsMet: true,
      bands: [
        {
          amount: 1_000_000,
          rateBp: 600,
          effectiveRateBp: 600,
          tax: 60_000,
          src: 'test-src',
        },
        {
          amount: 500_000,
          rateBp: 1800,
          effectiveRateBp: 1500,
          tax: 75_000,
          src: 'test-src',
        },
        {
          amount: 500_000,
          rateBp: 3600,
          effectiveRateBp: 1500,
          tax: 75_000,
          src: 'test-src',
        },
      ],
      tax: 210_000,
    });
    expect(result.grossTax).toBe(210_000);
    // Uncapped, the same income would be 60,000 + 90,000 + 180,000 = 330,000.
    expect(result.grossTax).not.toBe(330_000);
  });

  /**
   * The three tests below are the proof that the answer comes from capping the ladder
   * rather than from a hardcoded "first Rs. 1,000,000 at 6%, then 15%" table. Each
   * changes the *data* and expects the capped answer to change with it. A hardcoded
   * table returns 210,000 for all three.
   */

  it('follows the first band rate when the data moves it (6% -> 9%)', () => {
    const year = makeCappedYear({
      bands: [
        { width: 1_000_000, rateBp: 900, src: 'test-src' },
        ...SHORT_LADDER.slice(1),
      ],
    });
    // 1,000,000 @ 9% = 90,000 | 500,000 @ 15% = 75,000 | 500,000 @ 15% = 75,000
    const result = computeTax(syntheticCapped(2_000_000), year);
    expect(result.components.find((c) => c.kind === 'capped')?.bands[0]).toEqual({
      amount: 1_000_000,
      rateBp: 900,
      effectiveRateBp: 900,
      tax: 90_000,
      src: 'test-src',
    });
    expect(result.grossTax).toBe(240_000);
    expect(result.grossTax).not.toBe(210_000); // the hardcoded-table answer
  });

  it('charges a band BELOW the cap at its own rate, not at the cap (18% -> 12%)', () => {
    // This is the assertion a two-band table cannot survive. Drop the middle band under
    // the cap and it must be charged at 12%, not at 15%: the cap is a ceiling, not a
    // floor and not a schedule.
    const year = makeCappedYear({
      bands: [
        SHORT_LADDER[0] as DraftBand,
        { width: 500_000, rateBp: 1200, src: 'test-src' },
        SHORT_LADDER[2] as DraftBand,
      ],
    });
    // 1,000,000 @ 6% = 60,000 | 500,000 @ 12% = 60,000 | 500,000 @ 15% = 75,000
    const result = computeTax(syntheticCapped(2_000_000), year);
    expect(result.components.find((c) => c.kind === 'capped')?.bands[1]).toEqual({
      amount: 500_000,
      rateBp: 1200,
      effectiveRateBp: 1200,
      tax: 60_000,
      src: 'test-src',
    });
    expect(result.grossTax).toBe(195_000);
    expect(result.grossTax).not.toBe(210_000); // 15% on that band — the hardcoded answer
  });

  it('follows the band WIDTHS when the data moves them', () => {
    // Widen the 6% band to 1,500,000. A table that hardcodes "the first Rs. 1,000,000"
    // charges 1,000,000 @ 6% + 200,000 @ 15% = 90,000 on a taxable 1,200,000; capping
    // the ladder charges the whole 1,200,000 at the band's own 6%.
    const year = makeCappedYear({
      bands: [
        { width: 1_500_000, rateBp: 600, src: 'test-src' },
        { width: 500_000, rateBp: 1800, src: 'test-src' },
        { width: null, rateBp: 3600, src: 'test-src' },
      ],
    });

    const inFirstBand = computeTax(syntheticCapped(1_200_000), year);
    expect(inFirstBand.components.find((c) => c.kind === 'capped')?.bands).toHaveLength(
      1,
    );
    expect(inFirstBand.grossTax).toBe(72_000);
    expect(inFirstBand.grossTax).not.toBe(90_000); // the hardcoded-boundary answer

    // 1,500,000 @ 6% = 90,000 | 500,000 @ 15% = 75,000
    expect(computeTax(syntheticCapped(2_000_000), year).grossTax).toBe(165_000);
  });

  it('follows the cap itself when the data moves it (15% -> 20%)', () => {
    const year = makeCappedYear({ maxRateBp: 2000 });
    // 1,000,000 @ 6% = 60,000 | 500,000 @ 18% = 90,000 | 500,000 @ 20% = 100,000
    const result = computeTax(syntheticCapped(2_000_000), year);
    expect(result.components.find((c) => c.kind === 'capped')?.bands[1]).toMatchObject({
      rateBp: 1800,
      effectiveRateBp: 1800,
    });
    expect(result.grossTax).toBe(250_000);
  });

  it('reaches the familiar "6% then 15%" shape as an OUTPUT, on the real data', () => {
    // Pure capped income, Y/A 2025/2026 as committed. 5,000,000 gross, relief 1,800,000,
    // taxable 3,200,000, run over the real five-band ladder with every rate capped at 15%:
    //   1,000,000 @  6% =  60,000
    //     500,000 @ 15% =  75,000   (band rate 18%)
    //     500,000 @ 15% =  75,000   (band rate 24%)
    //     500,000 @ 15% =  75,000   (band rate 30%)
    //     700,000 @ 15% = 105,000   (band rate 36%)
    //                     -------
    //                     390,000
    const result = computeTax(cappedIncome(5_000_000), realYear());

    expect(result.partition).toEqual({ reliefEligible: 5_000_000, reliefIneligible: 0 });
    expect(result.deduction).toEqual({
      personalRelief: RELIEF,
      qualifyingPayments: 0,
      total: RELIEF,
    });
    expect(result.taxableMain).toBe(3_200_000);
    expect(result.taxableGain).toBe(0);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.kind).toBe('capped');
    expect(result.components[0]?.conditionsMet).toBe(true);
    expect(
      result.components[0]?.bands.map((b) => [
        b.amount,
        b.rateBp,
        b.effectiveRateBp,
        b.tax,
      ]),
    ).toEqual([
      [1_000_000, 600, 600, 60_000],
      [500_000, 1800, 1500, 75_000],
      [500_000, 2400, 1500, 75_000],
      [500_000, 3000, 1500, 75_000],
      [700_000, 3600, 1500, 105_000],
    ]);
    expect(result.grossTax).toBe(390_000);
    expect(result.taxPayable).toBe(390_000);
    expect(result.refusals).toEqual([]);
    // Both the ladder and the cap are verified: true in the committed data.
    expect(result.warnings).toEqual([]);
    expect(result.sourcesUsed).toEqual([
      'act-2-2025#s.5(3) — IRA Sch.5 para 2(a)(v); scope per PN/IT/2025-01 para 1',
      'act-2-2025#s.3(1)(b) — IRA Sch.1 para 1(1D)',
      'act-2-2025#s.3(1)(d) — IRA Sch.1 para 1(6)',
    ]);
  });
});

// ---------------------------------------------------------------------------
// THE CONDITION, EVALUATED FIRST
// ---------------------------------------------------------------------------

describe('the cap condition is evaluated first', () => {
  it('runs the FULL ladder, up to 36%, when the condition is not met', () => {
    // Identical gross to the pure-capped case above; only the remittance answer differs.
    const result = computeTax(cappedIncome(5_000_000, false), realYear());

    expect(result.taxableMain).toBe(3_200_000);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.kind).toBe('ladder');
    expect(
      result.components[0]?.bands.map((b) => [b.rateBp, b.effectiveRateBp, b.tax]),
    ).toEqual([
      [600, 600, 60_000],
      [1800, 1800, 90_000],
      [2400, 2400, 120_000],
      [3000, 3000, 150_000],
      [3600, 3600, 252_000],
    ]);
    expect(result.grossTax).toBe(672_000);
    // The cap did not apply: no reduced fallback schedule exists, ifNotMet is null.
    expect(result.grossTax).not.toBe(390_000);
    expect(result.warnings.map((w) => w.code)).toEqual(['rate-cap-condition-not-met']);
    expect(result.refusals).toEqual([]);
  });

  it('is the same amount of tax as an ordinary salary of the same size', () => {
    const unremitted = computeTax(cappedIncome(5_000_000, false), realYear());
    const salary = computeTax(
      {
        residency: 'resident',
        income: { employment: [{ label: 'S', amount: 5_000_000 }] },
      },
      realYear(),
    );
    expect(unremitted.grossTax).toBe(salary.grossTax);
    expect(unremitted.components[0]?.bands).toEqual(salary.components[0]?.bands);
  });

  it('requires EVERY condition the cap names, not just one of them', () => {
    // The statute has two limbs — received in foreign currency *and* remitted through a
    // bank — and a year may model them as two conditions. All must hold.
    const year = makeCappedYear({ capConditions: ['limb-a', 'limb-b'] });
    const both = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Overseas consultancy',
              amount: 2_000_000,
              tags: ['foreign-capped'],
              conditions: { 'limb-a': true, 'limb-b': true },
            },
          ],
        },
      },
      year,
    );
    expect(both.components.find((c) => c.kind === 'capped')?.tax).toBe(210_000);

    const onlyOne = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Overseas consultancy',
              amount: 2_000_000,
              tags: ['foreign-capped'],
              conditions: { 'limb-a': true, 'limb-b': false },
            },
          ],
        },
      },
      year,
    );
    expect(onlyOne.components.find((c) => c.kind === 'capped')).toBeUndefined();
    // Full ladder: 60,000 + 90,000 + 180,000
    expect(onlyOne.grossTax).toBe(330_000);
  });

  it('throws rather than default an unanswered condition either way', () => {
    const input: TaxInput = {
      residency: 'resident',
      income: {
        business: [
          { label: 'Overseas consultancy', amount: 5_000_000, tags: ['foreign-capped'] },
        ],
      },
    };
    expect(() => computeTax(input, realYear())).toThrow(
      /gives no answer for it.*remitted through a bank/s,
    );
  });

  it('answers the condition per item, not per taxpayer', () => {
    // A cap whose condition is met on one receipt and not on another is not itself the
    // ambiguous case — but it does put capped and uncapped income on the same ladder,
    // which is. Asserted in the refusal section below; here we only check both answers
    // were read.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Remitted',
              amount: 3_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: true },
            },
            {
              label: 'Kept offshore',
              amount: 2_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: false },
            },
          ],
        },
      },
      realYear(),
    );
    expect(result.warnings.map((w) => w.code)).toContain('rate-cap-condition-not-met');
    expect(isRefusal(result)).toBe(true);
  });

  it('warns, blockingly, when the year declares no cap for tagged income', () => {
    const year = makeCappedYear({ noCap: true });
    const result = computeTax(syntheticCapped(2_000_000), year);
    const warning = result.warnings.find((w) => w.code === 'rate-cap-not-implemented');
    expect(warning?.severity).toBe('blocking');
    // Full ladder: 60,000 + 90,000 + 180,000
    expect(result.grossTax).toBe(330_000);
  });
});

// ---------------------------------------------------------------------------
// THE REFUSAL — Q14. No figure, anywhere, for the mixed case.
// ---------------------------------------------------------------------------

describe('mixed capped and uncapped income refuses [Q14]', () => {
  const mixed: TaxInput = {
    residency: 'resident',
    income: {
      business: [
        {
          label: 'Overseas consultancy',
          amount: 4_000_000,
          tags: ['foreign-capped'],
          conditions: { [REMITTED]: true },
        },
      ],
      employment: [{ label: 'Local salary', amount: 2_000_000 }],
    },
  };

  it('returns a refusal naming Q14, and no figure', () => {
    const result = computeTax(mixed, realYear());

    expect(isRefusal(result)).toBe(true);
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0]?.code).toBe('mixed-capped-and-uncapped-ordering');
    expect(result.refusals[0]?.question).toBe('Q14');
    expect(result.refusals[0]?.explanation).toMatch(/does not say which/);
    expect(result.refusals[0]?.explanation).toMatch(/practitioner/);
  });

  it('exposes no number that could be rendered as an answer', () => {
    const result = computeTax(mixed, realYear());

    // There is no working, because no computation was performed.
    expect(result.components).toEqual([]);
    expect(result.grossTax).toBe(0);
    expect(result.taxPayable).toBe(0);
    expect(result.credits).toEqual({ apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 });
    expect(result.schedule).toEqual({
      instalments: [],
      finalPayment: { due: '', amount: 0 },
      returnDue: '',
    });

    // The income the taxpayer entered IS still reported — that is what they hand to a
    // practitioner — but nothing derived from a rate is.
    expect(result.partition).toEqual({ reliefEligible: 6_000_000, reliefIneligible: 0 });
    expect(result.taxableMain).toBe(4_200_000);
  });

  it('refuses when capped income sits alongside foreign income whose condition failed', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Remitted',
              amount: 3_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: true },
            },
            {
              label: 'Kept offshore',
              amount: 2_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: false },
            },
          ],
        },
      },
      realYear(),
    );
    expect(isRefusal(result)).toBe(true);
    expect(result.grossTax).toBe(0);
    expect(result.components).toEqual([]);
  });

  it('refuses when capped income sits alongside a separately-rated component', () => {
    // The separately-rated component is carved off the ladder, but the single Fifth
    // Schedule deduction still has to be divided between it and the capped income, and
    // nothing says how.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Remitted',
              amount: 4_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: true },
            },
            { label: 'Casino', amount: 2_000_000, tags: ['special-business'] },
          ],
        },
      },
      realYear(),
    );
    expect(isRefusal(result)).toBe(true);
  });

  it('does NOT refuse for capped income plus a capital gain', () => {
    // The gain never touches this ladder — it is outside relief [IRA Sch.5 para 2(a)]
    // and separately rated — so there is no ordering question to answer.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Overseas consultancy',
              amount: 5_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: true },
            },
          ],
          investment: [
            { label: 'Sale of land', amount: 1_000_000, tags: ['capital-gain'] },
          ],
        },
      },
      realYear(),
    );

    expect(result.refusals).toEqual([]);
    expect(result.taxableMain).toBe(3_200_000);
    expect(result.taxableGain).toBe(1_000_000);
    expect(result.components.find((c) => c.kind === 'capped')?.tax).toBe(390_000);
    expect(result.components.find((c) => c.kind === 'capital-gain')?.tax).toBe(100_000);
    expect(result.grossTax).toBe(490_000);
  });

  it('does NOT refuse when the deduction leaves nothing on the ladder', () => {
    // Every ordering gives the same answer when the answer is zero.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [
            {
              label: 'Overseas consultancy',
              amount: 1_000_000,
              tags: ['foreign-capped'],
              conditions: { [REMITTED]: true },
            },
          ],
          employment: [{ label: 'Salary', amount: 500_000 }],
        },
      },
      realYear(),
    );

    expect(result.refusals).toEqual([]);
    expect(result.taxableMain).toBe(0);
    expect(result.grossTax).toBe(0);
    expect(result.components).toEqual([{ kind: 'ladder', amount: 0, bands: [], tax: 0 }]);
  });

  it('does NOT refuse for uncapped income alone', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: { employment: [{ label: 'S', amount: 5_000_000 }] },
      },
      realYear(),
    );
    expect(isRefusal(result)).toBe(false);
    expect(result.grossTax).toBe(672_000);
  });
});

// ---------------------------------------------------------------------------
// maxRateBp INVARIANTS — throw, never silently overcharge
// ---------------------------------------------------------------------------

describe('maxRateBp invariants [docs/spec/calculation-engine.md step 6]', () => {
  /** Mutate a *parsed* year: the schema rejects these, and the point of the test is that
   * the engine does not trust that the schema ran. */
  function withCapRate(maxRateBp: number): TaxYearData {
    const year = structuredClone(makeCappedYear()) as TaxYearData;
    const cap = year.rateCaps['test-cap'];
    if (!cap) throw new Error('fixture has no test-cap');
    cap.maxRateBp = maxRateBp;
    return year;
  }

  it('throws when the cap equals the top marginal rate, rather than charging it in full', () => {
    // A cap at or above the top band reduces nothing, so income the Act entitles to a
    // maximum rate would silently be charged the full ladder — an overcharge.
    expect(() => computeTax(syntheticCapped(2_000_000), withCapRate(3600))).toThrow(
      /is not below the top marginal rate/,
    );
  });

  it('throws when the cap exceeds the top marginal rate', () => {
    expect(() => computeTax(syntheticCapped(2_000_000), withCapRate(4000))).toThrow(
      /is not below the top marginal rate/,
    );
  });

  it('throws on a cap outside the basis-point range', () => {
    expect(() => computeTax(syntheticCapped(2_000_000), withCapRate(10_001))).toThrow(
      /integer basis points 0-10000/,
    );
  });

  it('throws if a produced band was somehow charged above the cap', () => {
    // Not reachable through computeTax — walkBands applies min() — so asserted directly,
    // as engine.test.ts asserts walkBands' "does not cover the full amount" guard.
    expect(() =>
      assertWithinCap(
        [{ amount: 100, rateBp: 3600, effectiveRateBp: 3600, tax: 36, src: 'x' }],
        1500,
        'rateCaps.test-cap',
      ),
    ).toThrow(/above the declared maximum rate/);

    expect(() =>
      assertWithinCap(
        [{ amount: 100, rateBp: 3600, effectiveRateBp: 1500, tax: 15, src: 'x' }],
        1500,
        'rateCaps.test-cap',
      ),
    ).not.toThrow();
  });

  it('rejects a nonsensical maxRateBp at the walker', () => {
    expect(() => walkBands(100, SHORT_LADDER, -1)).toThrow(
      /integer basis points 0-10000 or null/,
    );
    expect(() => walkBands(100, SHORT_LADDER, 600.5)).toThrow(
      /integer basis points 0-10000 or null/,
    );
  });

  it('throws rather than choose between two caps on the same schedule', () => {
    expect(() =>
      computeTax(syntheticCapped(2_000_000), makeCappedYear({ extraCap: true })),
    ).toThrow(/declares 2 rate caps on schedule/);
  });

  it('warns when it applies a cap marked verified: false', () => {
    const result = computeTax(
      syntheticCapped(2_000_000),
      makeCappedYear({ capVerified: false }),
    );
    expect(result.warnings.map((w) => w.code)).toContain('unverified-rate');
    expect(result.warnings.find((w) => w.code === 'unverified-rate')?.message).toMatch(
      /Rate cap "test-cap"/,
    );
  });
});

// ---------------------------------------------------------------------------
// TERMINAL BENEFITS — two tables, selected by length of service
// ---------------------------------------------------------------------------

describe('terminal benefits [IRA Sch.1 para 1(2)(b), as enacted 2017]', () => {
  function retiree(gratuity: number, serviceYears: number, salary = 5_000_000): TaxInput {
    return {
      residency: 'resident',
      income: {
        employment: [
          { label: 'Salary', amount: salary },
          {
            label: 'Retiring gratuity',
            amount: gratuity,
            tags: ['terminal-benefit'],
            serviceYears,
          },
        ],
      },
    };
  }

  it('rates a short-service benefit on the atOrBelow table, field by field', () => {
    // Salary 5,000,000 + gratuity 4,000,000 = 9,000,000; relief 1,800,000;
    // taxable 7,200,000; the gratuity is carved out, leaving 3,200,000 on the ladder.
    //   ladder   3,200,000 -> 672,000 (the P04 figure for this taxable income)
    //   gratuity 4,000,000 on the <=20yr table:
    //       2,000,000 @  0% =       0
    //       1,000,000 @  5% =  50,000
    //       1,000,000 @ 10% = 100,000   ("Rs. 50,000 plus 10% of the excess over
    //                                     Rs. 3,000,000" — 09-terminal-benefits.md)
    //                         -------
    //                         150,000
    const result = computeTax(retiree(4_000_000, 15), realYear());

    expect(result.taxableMain).toBe(7_200_000);
    expect(result.components[0]).toMatchObject({ kind: 'ladder', amount: 3_200_000 });
    expect(result.components[0]?.tax).toBe(672_000);

    const benefit = result.components.find((c) => c.kind === 'terminal-benefit');
    expect(benefit?.amount).toBe(4_000_000);
    expect(benefit?.bands.map((b) => [b.amount, b.rateBp, b.tax])).toEqual([
      [2_000_000, 0, 0],
      [1_000_000, 500, 50_000],
      [1_000_000, 1000, 100_000],
    ]);
    expect(benefit?.tax).toBe(150_000);
    expect(result.grossTax).toBe(822_000);
  });

  it('rates a long-service benefit on the above table, field by field', () => {
    // 7,000,000 on the >20yr table:
    //   5,000,000 @  0% =       0
    //   1,000,000 @  5% =  50,000
    //   1,000,000 @ 10% = 100,000
    const result = computeTax(retiree(7_000_000, 30), realYear());
    const benefit = result.components.find((c) => c.kind === 'terminal-benefit');

    expect(benefit?.amount).toBe(7_000_000);
    expect(benefit?.bands.map((b) => [b.amount, b.rateBp, b.tax])).toEqual([
      [5_000_000, 0, 0],
      [1_000_000, 500, 50_000],
      [1_000_000, 1000, 100_000],
    ]);
    expect(benefit?.tax).toBe(150_000);
  });

  it('puts exactly the threshold year on the atOrBelow table, and one year more on above', () => {
    // The sharpest possible boundary: the same 4,000,000 gratuity is 150,000 of tax at
    // 20 years of service and nil at 21, because the nil band more than doubles.
    const at20 = computeTax(retiree(4_000_000, 20), realYear());
    const at21 = computeTax(retiree(4_000_000, 21), realYear());
    const at19 = computeTax(retiree(4_000_000, 19), realYear());

    expect(
      at20.components.find((c) => c.kind === 'terminal-benefit')?.bands[0]?.amount,
    ).toBe(2_000_000);
    expect(at20.components.find((c) => c.kind === 'terminal-benefit')?.tax).toBe(150_000);
    expect(at19.components.find((c) => c.kind === 'terminal-benefit')?.tax).toBe(150_000);

    expect(
      at21.components.find((c) => c.kind === 'terminal-benefit')?.bands[0]?.amount,
    ).toBe(4_000_000);
    expect(at21.components.find((c) => c.kind === 'terminal-benefit')?.tax).toBe(0);

    // The ladder part is identical; only the table moved.
    expect(at20.components[0]?.tax).toBe(at21.components[0]?.tax);
  });

  it('throws rather than default a missing serviceYears', () => {
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: {
            employment: [
              {
                label: 'Retiring gratuity',
                amount: 4_000_000,
                tags: ['terminal-benefit'],
              },
            ],
          },
        },
        realYear(),
      ),
    ).toThrow(/no serviceYears was given/);
  });

  it('throws on a fractional or negative serviceYears', () => {
    expect(() => computeTax(retiree(4_000_000, 20.5), realYear())).toThrow(
      /non-negative whole number of years/,
    );
    expect(() => computeTax(retiree(4_000_000, -1), realYear())).toThrow(
      /non-negative whole number of years/,
    );
  });

  it('throws rather than pick a table when two benefits declare different service', () => {
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: {
            employment: [
              {
                label: 'Gratuity A',
                amount: 2_000_000,
                tags: ['terminal-benefit'],
                serviceYears: 12,
              },
              {
                label: 'Gratuity B',
                amount: 2_000_000,
                tags: ['terminal-benefit'],
                serviceYears: 30,
              },
            ],
          },
        },
        realYear(),
      ),
    ).toThrow(/different serviceYears/);
  });

  it('warns that the 2017 tables are unverified whenever it actually applies them', () => {
    // The committed data marks terminal-benefit verified: false (Q32). A figure derived
    // from it is not a passing test on its own — it is a flagged one.
    const result = computeTax(retiree(4_000_000, 15), realYear());
    const unverified = result.warnings.filter((w) => w.code === 'unverified-rate');
    expect(unverified).toHaveLength(1);
    expect(unverified[0]?.message).toMatch(/terminal-benefit/);
    expect(unverified[0]?.severity).toBe('warn');
    // And it no longer claims the component is unimplemented — it is computed.
    expect(result.warnings.map((w) => w.code)).not.toContain('component-not-implemented');
  });

  it('warns even where the whole benefit lands in the nil band', () => {
    // 0% is a rate, and it is an unverified one. A nil charge computed from a stale
    // table is exactly the figure a taxpayer would rely on without checking.
    const result = computeTax(retiree(1_000_000, 15), realYear());
    expect(result.components.find((c) => c.kind === 'terminal-benefit')?.tax).toBe(0);
    expect(result.warnings.map((w) => w.code)).toContain('unverified-rate');
  });
});

// ---------------------------------------------------------------------------
// CAPITAL GAIN AND SPECIAL BUSINESS — flat rates, and only the remainder on the ladder
// ---------------------------------------------------------------------------

describe('capital gains [IRA Sch.1 para 1(2)(a), 2017; relief exclusion Sch.5 para 2(a)]', () => {
  it('rates the gain at its own flat rate, with the remainder on the ladder', () => {
    // Salary 3,000,000 + gain 1,000,000. Relief touches the salary only:
    //   taxable main 1,200,000 -> 60,000 + 36,000 = 96,000 on the ladder
    //   taxable gain 1,000,000 @ 10% = 100,000, in full
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
      realYear(),
    );

    expect(result.partition).toEqual({
      reliefEligible: 3_000_000,
      reliefIneligible: 1_000_000,
    });
    expect(result.deduction.total).toBe(RELIEF);
    expect(result.taxableMain).toBe(1_200_000);
    expect(result.taxableGain).toBe(1_000_000);
    expect(result.components[0]).toMatchObject({ kind: 'ladder', amount: 1_200_000 });
    expect(result.components[0]?.tax).toBe(96_000);

    const gain = result.components.find((c) => c.kind === 'capital-gain');
    expect(gain?.amount).toBe(1_000_000);
    expect(gain?.bands).toEqual([
      {
        amount: 1_000_000,
        rateBp: 1000,
        effectiveRateBp: 1000,
        tax: 100_000,
        src: 'ira-2017#Sch.1 para 1(2)(a) as enacted 2017; relief exclusion IRA Sch.5 para 2(a)',
      },
    ]);
    expect(gain?.tax).toBe(100_000);
    expect(result.grossTax).toBe(196_000);
    // The pooled (wrong) answer would put 2,200,000 on the ladder and rate no gain.
    expect(result.grossTax).not.toBe(330_000);
  });

  it('rates the gain even when relief wipes out every other rupee of income', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 500_000 }],
          investment: [{ label: 'Sale', amount: 5_000_000, tags: ['capital-gain'] }],
        },
      },
      realYear(),
    );
    expect(result.taxableMain).toBe(0);
    expect(result.taxableGain).toBe(5_000_000);
    expect(result.components.find((c) => c.kind === 'capital-gain')?.tax).toBe(500_000);
    expect(result.grossTax).toBe(500_000);
  });

  it('warns that the 2017 gains rate is superseded whenever it actually applies it', () => {
    // capital-gain is verified: false in the committed data (Q42 — Act No. 11 of 2026 is
    // not held). Any fixture whose figure depends on it is a flagged fixture.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          investment: [{ label: 'Sale', amount: 5_000_000, tags: ['capital-gain'] }],
        },
      },
      realYear(),
    );
    const unverified = result.warnings.filter((w) => w.code === 'unverified-rate');
    expect(unverified).toHaveLength(1);
    expect(unverified[0]?.message).toMatch(/capital-gain/);
    expect(result.warnings.map((w) => w.code)).not.toContain('component-not-implemented');
  });
});

describe('special business income [IRA Sch.1 para 1(2)(c), 2017; Act 2/2025 s.3(1)(c)]', () => {
  it('rates it flat at 45%, with only the remainder on the ladder', () => {
    // Salary 4,000,000 + casino 2,000,000 = 6,000,000; relief 1,800,000;
    // taxable 4,200,000; carve 2,000,000, leaving 2,200,000 on the ladder.
    //   ladder 2,200,000 -> 60,000 + 90,000 + 120,000 + 60,000 = 330,000
    //   casino 2,000,000 @ 45% = 900,000
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [{ label: 'Salary', amount: 4_000_000 }],
          business: [{ label: 'Casino', amount: 2_000_000, tags: ['special-business'] }],
        },
      },
      realYear(),
    );

    expect(result.taxableMain).toBe(4_200_000);
    expect(result.components[0]).toMatchObject({ kind: 'ladder', amount: 2_200_000 });
    expect(result.components[0]?.tax).toBe(330_000);

    const special = result.components.find((c) => c.kind === 'special-business');
    expect(special?.amount).toBe(2_000_000);
    expect(
      special?.bands.map((b) => [b.amount, b.rateBp, b.effectiveRateBp, b.tax]),
    ).toEqual([[2_000_000, 4500, 4500, 900_000]]);
    expect(special?.tax).toBe(900_000);
    expect(result.grossTax).toBe(1_230_000);
  });

  it('produces no unverified-rate warning, because that rate IS verified', () => {
    // The counterpart to the capital-gain and terminal-benefit tests: the warning has to
    // be targeted, or it means nothing.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          business: [{ label: 'Casino', amount: 4_000_000, tags: ['special-business'] }],
        },
      },
      realYear(),
    );
    expect(result.components.find((c) => c.kind === 'special-business')?.tax).toBe(
      990_000,
    );
    expect(result.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// "ONLY THE REMAINDER" — the carve, and what happens when relief eats into it
// ---------------------------------------------------------------------------

describe('"only the remainder" [IRA Sch.1 para 1(2)(d), as enacted 2017]', () => {
  it('carves every separately-rated component before the ladder runs', () => {
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [
            { label: 'Salary', amount: 5_000_000 },
            {
              label: 'Gratuity',
              amount: 3_000_000,
              tags: ['terminal-benefit'],
              serviceYears: 25,
            },
          ],
          business: [{ label: 'Casino', amount: 2_000_000, tags: ['special-business'] }],
          investment: [{ label: 'Sale', amount: 1_000_000, tags: ['capital-gain'] }],
        },
      },
      realYear(),
    );

    // reliefEligible 10,000,000 - 1,800,000 = 8,200,000 taxable main;
    // carve 3,000,000 + 2,000,000, leaving 3,200,000 on the ladder.
    expect(result.taxableMain).toBe(8_200_000);
    expect(result.taxableGain).toBe(1_000_000);
    expect(result.components.map((c) => [c.kind, c.amount, c.tax])).toEqual([
      ['ladder', 3_200_000, 672_000],
      ['terminal-benefit', 3_000_000, 0], // >20yr table, all inside the 5,000,000 nil band
      ['special-business', 2_000_000, 900_000],
      ['capital-gain', 1_000_000, 100_000],
    ]);
    expect(result.grossTax).toBe(1_672_000);
    // Every component's bands add up to its own tax, and they add up to the total.
    for (const component of result.components) {
      expect(component.bands.reduce((n, b) => n + b.tax, 0)).toBe(component.tax);
    }
    expect(result.components.reduce((n, c) => n + c.tax, 0)).toBe(result.grossTax);
  });

  it('reduces a lone component when the deduction bites into it', () => {
    // Gratuity 3,000,000 and nothing else: relief 1,800,000 leaves 1,200,000 of taxable
    // income, and there is nothing to allocate between, so the component takes it.
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          employment: [
            {
              label: 'Gratuity',
              amount: 3_000_000,
              tags: ['terminal-benefit'],
              serviceYears: 10,
            },
          ],
        },
      },
      realYear(),
    );
    expect(result.taxableMain).toBe(1_200_000);
    expect(result.components.find((c) => c.kind === 'terminal-benefit')?.amount).toBe(
      1_200_000,
    );
    expect(result.components.find((c) => c.kind === 'terminal-benefit')?.tax).toBe(0);
  });

  it('throws rather than allocate a shortfall between two differently-rated components', () => {
    // 1,000,000 gratuity + 1,000,000 casino, relief 1,800,000 -> 200,000 taxable. Whether
    // that 200,000 is the 0%-band gratuity or the 45% casino changes the answer, and
    // nothing in the spec says which.
    expect(() =>
      computeTax(
        {
          residency: 'resident',
          income: {
            employment: [
              {
                label: 'Gratuity',
                amount: 1_000_000,
                tags: ['terminal-benefit'],
                serviceYears: 10,
              },
            ],
            business: [
              { label: 'Casino', amount: 1_000_000, tags: ['special-business'] },
            ],
          },
        },
        realYear(),
      ),
    ).toThrow(/will not guess/);
  });
});

// ---------------------------------------------------------------------------
// MISSING DATA — never invented
// ---------------------------------------------------------------------------

describe('a component the year declares no rate for', () => {
  it('charges nothing and says, blockingly, that the data has no rate', () => {
    const year = makeCappedYear(); // separatelyRated: {}
    const result = computeTax(
      {
        residency: 'resident',
        income: {
          investment: [{ label: 'Sale', amount: 1_000_000, tags: ['capital-gain'] }],
        },
      },
      year,
    );

    const warning = result.warnings.find((w) => w.code === 'component-not-implemented');
    expect(warning?.severity).toBe('blocking');
    expect(warning?.message).toMatch(/declares no rate for it/);
    expect(result.components.find((c) => c.kind === 'capital-gain')).toEqual({
      kind: 'capital-gain',
      amount: 1_000_000,
      bands: [],
      tax: 0,
    });
    expect(result.grossTax).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Year scoping and purity, for the new code paths
// ---------------------------------------------------------------------------

describe('the cap and the components are resolved only from the taxYear argument', () => {
  it('recomputes an earlier capped year identically after a later one', () => {
    const lenient = makeCappedYear({ maxRateBp: 1000 });
    const strict = makeCappedYear({ maxRateBp: 2000 });

    const before = computeTax(syntheticCapped(2_000_000), lenient);
    computeTax(syntheticCapped(2_000_000), strict);
    const after = computeTax(syntheticCapped(2_000_000), lenient);

    expect(after).toEqual(before);
    // 1,000,000 @ 6% + 500,000 @ 10% + 500,000 @ 10%
    expect(before.grossTax).toBe(160_000);
  });

  it('does not mutate its arguments', () => {
    const input = cappedIncome(5_000_000);
    const year = realYear();
    const inputBefore = structuredClone(input);
    const yearBefore = structuredClone(year);
    computeTax(input, year);
    expect(input).toEqual(inputBefore);
    expect(year).toEqual(yearBefore);
  });

  it('never charges a capped taxpayer more than an uncapped one on the same income', () => {
    const year = realYear();
    for (let income = 0; income <= 12_000_000; income += 137_000) {
      const capped = computeTax(cappedIncome(income), year);
      const uncapped = computeTax(cappedIncome(income, false), year);
      expect(capped.grossTax).toBeLessThanOrEqual(uncapped.grossTax);
      expect(Number.isSafeInteger(capped.grossTax)).toBe(true);
    }
  });
});

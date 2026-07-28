/**
 * The calculation engine — part 1 (P04): partition, deduction, and the normal ladder.
 *
 * `docs/spec/calculation-engine.md` is authoritative for everything in here. Where this
 * file and that document disagree, the document is right and this file is a bug.
 *
 * Three properties hold, and are the reason this module imports nothing but types:
 *
 *   1. **Pure.** No I/O, no clock, no globals. Every rate, threshold, relief and date
 *      arrives in the `taxYear` argument. A function that can compute tax without being
 *      told the year of assessment is a bug [CLAUDE.md rule 5].
 *   2. **Integer rupees end to end.** Rates are basis points and are applied as
 *      `amount * rateBp / 10000` with the division last, in `BigInt`, so no intermediate
 *      value is ever a float and no large product silently loses precision.
 *   3. **Every step is retained.** `TaxResult` carries the full working so a failing
 *      fixture is diagnosable to the step that diverged.
 *
 * ## Scope of this slice
 *
 * Implemented: steps 1, 2, 3 and the plain-ladder part of step 6.
 *
 * Deliberately **not** implemented here (P05/P06 own them):
 *   - the 15% maximum-rate cap on `foreign-capped` income, and its condition (step 5)
 *   - the separately-rated components' own rates: capital gain, terminal benefit,
 *     special business (step 4)
 *   - the mixed capped/uncapped ordering refusal (Q14)
 *   - credits (step 7) and the payment schedule (step 8)
 *
 * Where income of a not-yet-implemented kind is present, this slice never invents a
 * number for it: the component is recorded with `tax: 0` and a **blocking** warning is
 * emitted, so an incomplete figure cannot be mistaken for a complete one.
 */

import type { Band, RateSchedule, TaxYearFile } from './schema';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The spec calls this `TaxYearData`; the loader's parsed type is `TaxYearFile`. Same
 * thing — aliased so the signature in `docs/spec/calculation-engine.md` reads literally. */
export type TaxYearData = TaxYearFile;

export const HEADS = ['employment', 'business', 'investment', 'other'] as const;
export type Head = (typeof HEADS)[number];

/**
 * Tags describe what an amount *is*, and drive steps 2–5. Untagged income is ordinary
 * income for the normal ladder. See the Tag table in `docs/spec/calculation-engine.md`.
 */
export const INCOME_TAGS = [
  'capital-gain',
  'terminal-benefit',
  'special-business',
  'foreign-capped',
] as const;
export type IncomeTag = (typeof INCOME_TAGS)[number];

/** Residency determines which reliefs apply, via each relief's own `appliesTo` list in
 * the tax-year data — the engine does not hardcode who gets what. */
export type Residency = 'resident' | 'non-resident-citizen' | 'non-resident';

export interface IncomeItem {
  label: string;
  /** Integer rupees, gross of that head's deductions. */
  amount: number;
  /** Zero or more tags. Untagged = ordinary income for the ladder. */
  tags?: readonly IncomeTag[];
  /** Length of service, for `terminal-benefit` table selection. Unused in this slice. */
  serviceYears?: number;
  /** Answers to the tax-year data's `conditions`, by condition id. Unused in this slice. */
  conditions?: Readonly<Record<string, boolean>>;
}

export interface TaxInput {
  residency: Residency;
  /** Income by head. Each head's items are summed and that head's deduction subtracted. */
  income: Partial<Record<Head, readonly IncomeItem[]>>;
  /** Deductions attributable to a head (e.g. business expenses), in integer rupees. */
  deductions?: Partial<Record<Head, number>>;
  /**
   * The allowable qualifying-payment amount, in integer rupees. Deducted together with
   * personal relief as the single aggregate Fifth Schedule amount [IRA s.52(1)].
   *
   * This is the *allowable* figure, not the amount paid: the `cap`/`rate` semantics of
   * `taxYear.qualifyingPayments[]` are not specified in `docs/spec/`, and Y/A 2025/2026
   * declares no qualifying payment types at all. Rather than guess how `rate` and `cap`
   * combine, the engine warns if a year declares types it cannot interpret.
   */
  qualifyingPayments?: number;
  /** Tax already collected. Not applied in this slice — P06 owns step 7. */
  creditsPaid?: { apit?: number; ait?: number; foreign?: number };
  /** The taxpayer's own s.91/s.92 estimate. Not used in this slice — P06 owns step 8. */
  estimatedTaxForInstalments?: number;
  /** Which schedule in `taxYear.rateSchedules` is the normal ladder. See
   * `NORMAL_LADDER_SCHEDULE_ID` for how this resolves when omitted. */
  scheduleId?: string;
}

export interface ResultBand {
  amount: number;
  rateBp: number;
  /** The rate actually charged. Equal to `rateBp` until P05 introduces the cap. */
  effectiveRateBp: number;
  tax: number;
  src: string;
}

export type ComponentKind =
  'ladder' | 'capped' | 'capital-gain' | 'terminal-benefit' | 'special-business';

export interface ResultComponent {
  kind: ComponentKind;
  amount: number;
  conditionsMet?: boolean;
  bands: ResultBand[];
  tax: number;
}

export interface ResultWarning {
  code: string;
  message: string;
  severity: 'info' | 'warn' | 'blocking';
}

export interface ResultRefusal {
  code: string;
  question: string;
  explanation: string;
}

export interface TaxResult {
  yearOfAssessment: string;
  assessableByHead: Record<Head, number>;
  partition: { reliefEligible: number; reliefIneligible: number };
  deduction: { personalRelief: number; qualifyingPayments: number; total: number };
  taxableMain: number;
  taxableGain: number;
  components: ResultComponent[];
  grossTax: number;
  credits: { apit: number; ait: number; foreign: number; total: number; excess: number };
  taxPayable: number;
  schedule: {
    instalments: { quarter: number; due: string; amount: number }[];
    finalPayment: { due: string; amount: number };
    /** Derived from `period.to` + `returnDueRule.monthsAfterYearEnd` — P06. Empty here. */
    returnDue: string;
  };
  refusals: ResultRefusal[];
  warnings: ResultWarning[];
  sourcesUsed: string[];
}

// ---------------------------------------------------------------------------
// Warning codes
// ---------------------------------------------------------------------------

export const WARNING_CODES = {
  /** A rate this computation actually applied carries `verified: false` in the data. */
  unverifiedRate: 'unverified-rate',
  /** Income of a separately-rated kind is present; its own rate is P05's, not computed. */
  componentNotImplemented: 'component-not-implemented',
  /** `foreign-capped` income is present; the cap is P05's, so the ladder ran uncapped. */
  rateCapNotImplemented: 'rate-cap-not-implemented',
  /** The year declares qualifying payment types whose cap/rate semantics are unspecified. */
  qualifyingPaymentTypes: 'qualifying-payment-types-not-modelled',
} as const;

// ---------------------------------------------------------------------------
// Integer money helpers — no floats, anywhere, including intermediates
// ---------------------------------------------------------------------------

const BASIS_POINT_DENOMINATOR = 10_000n;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function assertMoney(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label}: expected a number, got ${String(value)}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(
      `${label}: money must be integer rupees, never a float — got ${value}`,
    );
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(
      `${label}: ${value} exceeds the exactly-representable integer range; refusing to compute on a value that has already lost precision`,
    );
  }
  if (value < 0) {
    throw new Error(`${label}: expected a non-negative amount, got ${value}`);
  }
}

function toSafeNumber(value: bigint, label: string): number {
  if (value > MAX_SAFE) {
    throw new Error(
      `${label}: result ${value} exceeds the exactly-representable integer range`,
    );
  }
  return Number(value);
}

/** Sum integer rupees exactly, then check the total is still exactly representable. */
function sumMoney(values: readonly number[], label: string): number {
  let total = 0n;
  for (const value of values) total += BigInt(value);
  return toSafeNumber(total, label);
}

/**
 * `floor(amount * rateBp / 10000)`, computed in `BigInt` so the multiplication cannot
 * overflow into float territory and the division is exact truncation. Both operands are
 * non-negative here, so truncation is floor.
 */
export function taxOnAmount(amount: number, rateBp: number): number {
  assertMoney(amount, 'taxOnAmount(amount)');
  if (!Number.isInteger(rateBp) || rateBp < 0 || rateBp > 10_000) {
    throw new Error(
      `taxOnAmount(rateBp): expected integer basis points 0-10000, got ${rateBp}`,
    );
  }
  return toSafeNumber(
    (BigInt(amount) * BigInt(rateBp)) / BASIS_POINT_DENOMINATOR,
    'taxOnAmount',
  );
}

// ---------------------------------------------------------------------------
// Ladder resolution
// ---------------------------------------------------------------------------

/**
 * The conventional id of the normal individual ladder in `rateSchedules`, per
 * `docs/spec/data-model.md`. Resolution order, so that adding a year needs no code
 * change [CLAUDE.md rule 7]:
 *
 *   1. `input.scheduleId`, if given — must exist in the data
 *   2. this id, if the year declares it
 *   3. the sole schedule, if the year declares exactly one
 *   4. otherwise throw, naming the candidates — guessing which ladder a taxpayer sits on
 *      is exactly the kind of plausible wrong answer this engine must not produce
 */
export const NORMAL_LADDER_SCHEDULE_ID = 'individual-normal';

function resolveLadder(
  input: TaxInput,
  taxYear: TaxYearData,
): { id: string; schedule: RateSchedule } {
  const ids = Object.keys(taxYear.rateSchedules);

  if (input.scheduleId !== undefined) {
    const schedule = taxYear.rateSchedules[input.scheduleId];
    if (!schedule) {
      throw new Error(
        `input.scheduleId "${input.scheduleId}" is not a schedule in rateSchedules for ${taxYear.yearOfAssessment} (have: ${ids.join(', ') || 'none'})`,
      );
    }
    return { id: input.scheduleId, schedule };
  }

  const conventional = taxYear.rateSchedules[NORMAL_LADDER_SCHEDULE_ID];
  if (conventional) return { id: NORMAL_LADDER_SCHEDULE_ID, schedule: conventional };

  const [onlyId] = ids;
  if (ids.length === 1 && onlyId !== undefined) {
    const schedule = taxYear.rateSchedules[onlyId];
    if (schedule) return { id: onlyId, schedule };
  }

  throw new Error(
    `cannot resolve the normal ladder for ${taxYear.yearOfAssessment}: no "${NORMAL_LADDER_SCHEDULE_ID}" schedule and ${ids.length} schedules to choose from (${ids.join(', ') || 'none'}). Pass input.scheduleId.`,
  );
}

/**
 * Walk the bands in order, filling each band's `width` (the last band's `width` is
 * `null` — the balance). **Floor per band, then sum**, never sum-then-round: rounding
 * the total instead of each band shifts the answer by a rupee or two in a way that is
 * invisible in a spot check and permanent in a fixture.
 *
 * Only bands that actually carry an amount are returned; a zero band tells the reader
 * nothing and clutters the working the UI shows.
 */
export function walkBands(amount: number, bands: readonly Band[]): ResultBand[] {
  assertMoney(amount, 'walkBands(amount)');

  const out: ResultBand[] = [];
  let remaining = amount;

  for (const band of bands) {
    if (remaining <= 0) break;
    const inBand = band.width === null ? remaining : Math.min(remaining, band.width);
    if (inBand > 0) {
      out.push({
        amount: inBand,
        rateBp: band.rateBp,
        // P05 replaces this with min(rateBp, cap.maxRateBp) for capped components.
        effectiveRateBp: band.rateBp,
        tax: taxOnAmount(inBand, band.rateBp),
        src: band.src,
      });
    }
    remaining -= inBand;
  }

  if (remaining > 0) {
    // Unreachable against schema-valid data: the schema requires exactly one band with
    // width: null, and requires it to be last. Explicit rather than silently untaxed.
    throw new Error(
      `rate schedule does not cover the full amount: ${remaining} rupees left after the last band. The schedule is missing its unbounded (width: null) final band.`,
    );
  }

  return out;
}

// ---------------------------------------------------------------------------
// Steps 1 and 2 — assessable income per head, then partition
// ---------------------------------------------------------------------------

function hasTag(item: IncomeItem, tag: IncomeTag): boolean {
  return item.tags?.includes(tag) ?? false;
}

/**
 * Precedence when an item carries more than one tag. `capital-gain` wins outright: it is
 * the tag that moves an amount out of the relief pool [IRA Sch.5 para 2(a), as enacted
 * 2017], and misclassifying it is the error with the largest consequence.
 */
function classify(item: IncomeItem): IncomeTag | 'ordinary' {
  for (const tag of INCOME_TAGS) if (hasTag(item, tag)) return tag;
  return 'ordinary';
}

interface HeadTotals {
  assessableByHead: Record<Head, number>;
  /** Gross (pre-deduction) totals of each tagged class, across all heads. */
  taggedTotals: Record<IncomeTag, number>;
  capitalGainTotal: number;
  totalAssessable: number;
}

function computeHeads(input: TaxInput): HeadTotals {
  const assessableByHead = { employment: 0, business: 0, investment: 0, other: 0 };
  const taggedTotals: Record<IncomeTag, number> = {
    'capital-gain': 0,
    'terminal-benefit': 0,
    'special-business': 0,
    'foreign-capped': 0,
  };

  for (const head of HEADS) {
    const items = input.income[head] ?? [];
    const amounts: number[] = [];

    items.forEach((item, i) => {
      assertMoney(item.amount, `income.${head}[${i}] (${item.label}).amount`);
      amounts.push(item.amount);
      const kind = classify(item);
      if (kind !== 'ordinary') taggedTotals[kind] += item.amount;
    });

    const gross = sumMoney(amounts, `income.${head}`);

    const deduction = input.deductions?.[head] ?? 0;
    assertMoney(deduction, `deductions.${head}`);

    if (deduction > gross) {
      // A head in loss raises loss relief / carry-forward questions (IRA s.19 and the
      // Sixth Schedule) that no document in docs/spec/ resolves. Producing a number by
      // netting the loss against other heads would be a guess with a real consequence,
      // so this path stops rather than answers.
      throw new Error(
        `deductions.${head} (${deduction}) exceeds assessable income from that head (${gross}). Loss treatment is not modelled by this engine — see docs/spec/calculation-engine.md.`,
      );
    }

    assessableByHead[head] = gross - deduction;
  }

  // Deductions are attributed to a head, so a tagged amount inside a head with a
  // deduction would need an allocation rule the spec does not give. The engine refuses
  // to invent one rather than quietly apportioning.
  for (const head of HEADS) {
    const deduction = input.deductions?.[head] ?? 0;
    if (deduction === 0) continue;
    const tagged = (input.income[head] ?? []).some(
      (item) => classify(item) !== 'ordinary',
    );
    if (tagged) {
      throw new Error(
        `deductions.${head} is set and that head also contains tagged (separately-rated or capped) income. How a head's deductions are apportioned between its tagged and ordinary amounts is not specified in docs/spec/calculation-engine.md; the engine will not guess.`,
      );
    }
  }

  return {
    assessableByHead,
    taggedTotals,
    capitalGainTotal: taggedTotals['capital-gain'],
    totalAssessable: sumMoney(Object.values(assessableByHead), 'total assessable income'),
  };
}

// ---------------------------------------------------------------------------
// computeTax
// ---------------------------------------------------------------------------

/**
 * Compute the liability for one taxpayer for one year of assessment.
 *
 * Pure: the same `(input, taxYear)` always produces the same `TaxResult`. Every rate
 * comes from `taxYear`; nothing is read from the clock, the filesystem or a module-level
 * mutable.
 */
export function computeTax(input: TaxInput, taxYear: TaxYearData): TaxResult {
  const warnings: ResultWarning[] = [];
  const sourcesUsed: string[] = [];
  const noteSource = (src: string): void => {
    if (!sourcesUsed.includes(src)) sourcesUsed.push(src);
  };

  // -- step 1: assessable income, per head ---------------------------------
  const heads = computeHeads(input);

  // -- step 2: partition, BEFORE any deduction -----------------------------
  // Everything except `capital-gain` is relief-eligible; the gains are not
  // [IRA Sch.5 para 2(a), as enacted 2017]. Pooling gains with income and then
  // deducting relief overstates the relief and understates the tax.
  const reliefIneligible = heads.capitalGainTotal;
  const reliefEligible = heads.totalAssessable - reliefIneligible;
  if (reliefEligible < 0) {
    // Only reachable if a head's deduction was attributed against a capital gain, which
    // computeHeads already refuses. Defensive.
    throw new Error(
      `partition produced a negative relief-eligible amount (${reliefEligible}); capital gains exceed total assessable income after head deductions`,
    );
  }

  // -- step 3: one deduction, applied once, to the relief-eligible pool only -
  // Relief and qualifying payments are a single deduction of the aggregate Fifth
  // Schedule amount [IRA s.52(1)], applied once against aggregated income — not per
  // head. Which reliefs apply is data: each relief names the residency statuses it
  // covers, so a new relief or a new year needs no code change.
  let personalRelief = 0;
  for (const [id, relief] of Object.entries(taxYear.reliefs)) {
    if (!relief.appliesTo.includes(input.residency)) continue;
    assertMoney(relief.amount, `reliefs.${id}.amount`);
    personalRelief += relief.amount;
    noteSource(relief.src);
  }

  const qualifyingPayments = input.qualifyingPayments ?? 0;
  assertMoney(qualifyingPayments, 'input.qualifyingPayments');

  if (taxYear.qualifyingPayments.length > 0) {
    warnings.push({
      code: WARNING_CODES.qualifyingPaymentTypes,
      severity: 'warn',
      message: `${taxYear.yearOfAssessment} declares ${taxYear.qualifyingPayments.length} qualifying payment type(s) (${taxYear.qualifyingPayments.map((q) => q.id).join(', ')}). The engine deducted the allowable amount supplied in the input as given; it does not compute each type's cap and rate, because how they combine is not specified in docs/spec/.`,
    });
  }

  const deductionTotal = personalRelief + qualifyingPayments;
  const taxableMain = Math.max(0, reliefEligible - deductionTotal);
  // No deduction applies to gains, and unused relief does not spill onto them: the floor
  // at zero applies to taxableMain only [docs/spec/calculation-engine.md step 3].
  const taxableGain = reliefIneligible;

  // -- step 4 (carve only; the rates themselves are P05) --------------------
  // "only the remainder of the individual's taxable income shall be taxed at the rates
  // referred to in subparagraph (1)" [IRA Sch.1 para 1(2)(d), as enacted 2017].
  const components: ResultComponent[] = [];
  const separatelyRatedFromMain: { kind: ComponentKind; amount: number }[] = [];
  for (const tag of ['terminal-benefit', 'special-business'] as const) {
    const amount = heads.taggedTotals[tag];
    if (amount > 0) separatelyRatedFromMain.push({ kind: tag, amount });
  }

  const carvedOut = Math.min(
    taxableMain,
    sumMoney(
      separatelyRatedFromMain.map((c) => c.amount),
      'separately-rated components',
    ),
  );
  const ladderAmount = taxableMain - carvedOut;

  // -- step 6 (plain ladder only; the cap is P05) ---------------------------
  const { id: ladderId, schedule } = resolveLadder(input, taxYear);
  const ladderBands = walkBands(ladderAmount, schedule.bands);
  for (const band of ladderBands) noteSource(band.src);

  const ladderTax = sumMoney(
    ladderBands.map((b) => b.tax),
    'ladder tax',
  );

  components.push({
    kind: 'ladder',
    amount: ladderAmount,
    bands: ladderBands,
    tax: ladderTax,
  });

  if (ladderBands.length > 0 && !schedule.verified) {
    warnings.push({
      code: WARNING_CODES.unverifiedRate,
      severity: 'warn',
      message: `Rate schedule "${ladderId}" (${schedule.label}) is marked verified: false in the ${taxYear.yearOfAssessment} data. The figure below was computed from a rate that has not been confirmed against a primary source.`,
    });
  }

  // Separately-rated components are recorded so the working shows them, but their tax is
  // NOT computed here — P05 owns their rates. A blocking warning goes with each, because
  // a zero in a tax column that should hold a figure is exactly the kind of plausible
  // wrong answer this engine exists to avoid.
  const uncomputed: { kind: ComponentKind; amount: number }[] = [
    ...separatelyRatedFromMain,
  ];
  if (taxableGain > 0) uncomputed.push({ kind: 'capital-gain', amount: taxableGain });

  for (const component of uncomputed) {
    components.push({
      kind: component.kind,
      amount: component.amount,
      bands: [],
      tax: 0,
    });
    warnings.push({
      code: WARNING_CODES.componentNotImplemented,
      severity: 'blocking',
      message: `This computation includes ${component.amount} rupees of "${component.kind}" income, which the Act rates separately [IRA Sch.1 para 1(2), as enacted 2017]. That rate is not applied by this version of the engine, so the tax shown is incomplete and understates the liability. Do not rely on it.`,
    });
  }

  if (heads.taggedTotals['foreign-capped'] > 0) {
    warnings.push({
      code: WARNING_CODES.rateCapNotImplemented,
      severity: 'blocking',
      message: `This computation includes ${heads.taggedTotals['foreign-capped']} rupees of income eligible for the maximum-rate cap [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. The cap is not applied by this version of the engine: that income was taxed on the full ladder, so the tax shown may overstate the liability. Do not rely on it.`,
    });
  }

  // -- step 6 total ---------------------------------------------------------
  const grossTax = sumMoney(
    components.map((c) => c.tax),
    'gross tax',
  );

  // -- step 7: credits — P06. Zeroed, not omitted, so P06 extends the shape --
  const credits = { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 };
  const taxPayable = Math.max(0, grossTax - credits.total);

  return {
    yearOfAssessment: taxYear.yearOfAssessment,
    assessableByHead: heads.assessableByHead,
    partition: { reliefEligible, reliefIneligible },
    deduction: { personalRelief, qualifyingPayments, total: deductionTotal },
    taxableMain,
    taxableGain,
    components,
    grossTax,
    credits,
    taxPayable,
    // -- step 8: the payment schedule — P06. Present and empty, never absent.
    schedule: {
      instalments: [],
      finalPayment: { due: '', amount: 0 },
      returnDue: '',
    },
    // Populated by P05 for the mixed capped/uncapped ordering question (Q14).
    refusals: [],
    warnings,
    sourcesUsed,
  };
}

/**
 * The calculation engine — parts 1 (P04) and 2 (P05).
 *
 * P04: partition, the single aggregate deduction, and the normal ladder.
 * P05: the separately-rated components, the maximum-rate cap, and the Q14 refusal.
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
 * Implemented: steps 1, 2, 3, 4, 5 and 6.
 *
 * Deliberately **not** implemented here (P06 owns them):
 *   - credits (step 7) and the payment schedule (step 8)
 *
 * Where a year's data declares no rate for a component this computation needs, the
 * engine never invents one: the component is recorded with `tax: 0` and a **blocking**
 * warning, so an incomplete figure cannot be mistaken for a complete one.
 *
 * ## Refusals
 *
 * One case is not a missing feature but an unresolved question of law: where a taxpayer
 * has both capped and uncapped income on the same ladder, the Act does not say which
 * occupies the lower bands (Q14). The engine **refuses** — see `isRefusal` and the note
 * on `TaxResult.refusals`. A refusal sends the user to a practitioner; a plausible wrong
 * number sends them to IRD with a wrong return
 * [docs/decisions/adr-0003-disclaimer-and-liability-posture.md].
 */

import type {
  Band,
  RateCap,
  RateSchedule,
  SeparatelyRatedComponent,
  TaxYearFile,
} from './schema';

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
  /**
   * Length of service in whole years, for `terminal-benefit` table selection against
   * `separatelyRated["terminal-benefit"].selector.thresholdYears`. **Required** on any
   * item tagged `terminal-benefit`: the two tables differ materially, so an absent value
   * throws rather than defaulting [IRA Sch.1 para 1(2)(b), as enacted 2017].
   */
  serviceYears?: number;
  /**
   * Answers to the tax-year data's `conditions`, by condition id — e.g.
   * `{ 'remitted-through-bank-to-sri-lanka': true }`. **Required** for every condition
   * named by a rate cap that would otherwise apply to this item: an unanswered condition
   * is not a "no", and defaulting it either way silently moves the income between the
   * capped rate and the full ladder, so an absent answer throws.
   */
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
  /**
   * The rate actually charged on this band: `min(rateBp, cap.maxRateBp)` for a capped
   * component, and `rateBp` everywhere else. The pair is retained rather than collapsed
   * so the working shows *that* a cap bit, and by how much.
   */
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

/**
 * The full working of one computation.
 *
 * ## Detecting a refusal — the one rule a caller must not get wrong
 *
 * **`refusals.length > 0` means no figure was produced.** It is the single, unambiguous
 * signal, and `isRefusal(result)` is the supported way to test it. When it is true:
 *
 *   - `grossTax`, `taxPayable`, `credits` and `schedule` are **zeroed placeholders**,
 *     present only because this type has no optional numbers. They are not the answer,
 *     they are not "zero tax", and rendering them as a figure is a defect.
 *   - `components` is **empty** — there is no working to show, because none was produced.
 *   - The income fields (`assessableByHead`, `partition`, `deduction`, `taxableMain`,
 *     `taxableGain`) *are* meaningful: they are what the taxpayer entered, computed up to
 *     the point the law runs out, and they are what a practitioner needs to take over.
 *
 * A refusal is not a warning. A warning qualifies a figure that was produced; a refusal
 * says none was. The UI renders them differently and must never collapse either
 * [docs/spec/calculation-engine.md, "Result shape"].
 */
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
  /**
   * Income of a separately-rated kind is present, but **this year's data declares no
   * rate for it** in `separatelyRated`. Blocking: the component is recorded at `tax: 0`,
   * which understates the liability, and the engine will not invent the missing rate.
   *
   * (The code string predates P05, when it meant "the engine does not implement this
   * yet". P05 implements all three kinds; the string is retained because it is what a
   * consumer already matches on, and the meaning — *no figure for this component* — is
   * unchanged.)
   */
  componentNotImplemented: 'component-not-implemented',
  /**
   * `foreign-capped` income is present, but **this year's data declares no rate cap** on
   * the resolved ladder. Blocking: that income ran at the full ladder rate, which
   * overstates the liability if a cap in fact exists in law for the year.
   */
  rateCapNotImplemented: 'rate-cap-not-implemented',
  /**
   * A rate cap exists but its condition was not met for some `foreign-capped` income, so
   * the cap did not apply to it and the ladder stood unmodified. `ifNotMet` is `null` —
   * there is no fallback schedule [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].
   */
  rateCapConditionNotMet: 'rate-cap-condition-not-met',
  /** The year declares qualifying payment types whose cap/rate semantics are unspecified. */
  qualifyingPaymentTypes: 'qualifying-payment-types-not-modelled',
} as const;

export const REFUSAL_CODES = {
  /**
   * Both capped and uncapped income on the same ladder. Which occupies the lower bands
   * is not stated by the Act — Q14, `docs/research/12-open-questions.md`.
   */
  mixedCappedAndUncapped: 'mixed-capped-and-uncapped-ordering',
} as const;

/**
 * `true` when the engine produced **no figure** for this input. See the note on
 * `TaxResult`: when this is true the numeric fields are zeroed placeholders, not an
 * answer, and must not be rendered as one.
 */
export function isRefusal(result: TaxResult): boolean {
  return result.refusals.length > 0;
}

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
 *
 * `maxRateBp` is the **maximum-rate cap**, or `null` for an uncapped walk. When set, the
 * rate charged on each band is `min(bandRateBp, maxRateBp)`
 * [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].
 *
 * This is the whole of the cap. There is no second band table anywhere in this engine,
 * and the familiar "first Rs. 1,000,000 at 6%, balance at 15%" is an *output* of running
 * this function over the normal ladder — never an input. Encoding the output as a table
 * would give the right answer today and a silently wrong one the first time a band moves
 * [docs/spec/data-model.md, "Reduced rates are a cap, not a schedule"].
 */
export function walkBands(
  amount: number,
  bands: readonly Band[],
  maxRateBp: number | null = null,
): ResultBand[] {
  assertMoney(amount, 'walkBands(amount)');
  if (
    maxRateBp !== null &&
    (!Number.isInteger(maxRateBp) || maxRateBp < 0 || maxRateBp > 10_000)
  ) {
    throw new Error(
      `walkBands(maxRateBp): expected integer basis points 0-10000 or null, got ${maxRateBp}`,
    );
  }

  const out: ResultBand[] = [];
  let remaining = amount;

  for (const band of bands) {
    if (remaining <= 0) break;
    const inBand = band.width === null ? remaining : Math.min(remaining, band.width);
    if (inBand > 0) {
      const effectiveRateBp =
        maxRateBp === null ? band.rateBp : Math.min(band.rateBp, maxRateBp);
      out.push({
        amount: inBand,
        rateBp: band.rateBp,
        effectiveRateBp,
        tax: taxOnAmount(inBand, effectiveRateBp),
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

/**
 * Post-condition on a capped walk: **no band may be charged above the cap**
 * [docs/spec/calculation-engine.md, step 6 — "a band whose capped rate still exceeds the
 * cap is a data error and must throw, not silently overcharge"].
 *
 * With `walkBands`' `min()` this cannot fire, which is the point: it is a guard against a
 * future edit that reintroduces a table, applies the wrong cap to the wrong schedule, or
 * "helpfully" restores a full rate. Overcharging a taxpayer quietly is the failure mode
 * this asserts away, so it is checked on the produced bands rather than assumed from the
 * code that produced them. Asserted directly in the tests, as `walkBands`' own
 * "does not cover the full amount" guard is.
 */
export function assertWithinCap(
  bands: readonly ResultBand[],
  maxRateBp: number,
  label: string,
): void {
  for (const band of bands) {
    if (band.effectiveRateBp > maxRateBp) {
      throw new Error(
        `${label}: a band was charged at ${band.effectiveRateBp} bp, above the declared maximum rate of ${maxRateBp} bp. Charging above a statutory maximum overcharges the taxpayer; the engine stops rather than return that figure [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].`,
      );
    }
  }
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
  /**
   * The items behind those totals, in input order. Steps 4 and 5 need the items and not
   * just the totals: table selection reads `serviceYears`, and the cap's condition is
   * answered **per item**, so one consultant can have remitted earnings and unremitted
   * earnings in the same year.
   */
  taggedItems: Record<IncomeTag, IncomeItem[]>;
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
  const taggedItems: Record<IncomeTag, IncomeItem[]> = {
    'capital-gain': [],
    'terminal-benefit': [],
    'special-business': [],
    'foreign-capped': [],
  };

  for (const head of HEADS) {
    const items = input.income[head] ?? [];
    const amounts: number[] = [];

    items.forEach((item, i) => {
      assertMoney(item.amount, `income.${head}[${i}] (${item.label}).amount`);
      amounts.push(item.amount);
      const kind = classify(item);
      if (kind !== 'ordinary') {
        taggedTotals[kind] += item.amount;
        taggedItems[kind].push(item);
      }
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
    taggedItems,
    capitalGainTotal: taggedTotals['capital-gain'],
    totalAssessable: sumMoney(Object.values(assessableByHead), 'total assessable income'),
  };
}

// ---------------------------------------------------------------------------
// Step 4 — the separately-rated components
// ---------------------------------------------------------------------------

/** The union in the schema is discriminated by shape, not by a tag field. */
function isSelectorTable(
  component: SeparatelyRatedComponent,
): component is Extract<SeparatelyRatedComponent, { selector: unknown }> {
  return 'selector' in component;
}

/**
 * Which of the two terminal-benefit tables applies, from the length of service the
 * taxpayer actually had.
 *
 * There is no default. The nil band is Rs. 2,000,000 at or below the threshold and
 * Rs. 5,000,000 above it [IRA Sch.1 para 1(2)(b)(i)–(ii), as enacted 2017], so guessing
 * costs a real person real money in either direction — and the person receiving a
 * terminal benefit is typically newly out of work.
 */
function resolveServiceYears(items: readonly IncomeItem[]): number {
  const seen = new Set<number>();

  for (const item of items) {
    const years = item.serviceYears;
    if (years === undefined) {
      throw new Error(
        `income item "${item.label}" is tagged "terminal-benefit", which the Act rates on tables selected by the period of contribution or employment [IRA Sch.1 para 1(2)(b), as enacted 2017], but no serviceYears was given. The two tables differ materially — the nil band is 2,000,000 at or below the threshold and 5,000,000 above it — so there is no safe default. Supply IncomeItem.serviceYears.`,
      );
    }
    if (!Number.isInteger(years) || years < 0) {
      throw new Error(
        `income item "${item.label}": serviceYears must be a non-negative whole number of years, got ${years}`,
      );
    }
    seen.add(years);
  }

  if (seen.size > 1) {
    throw new Error(
      `terminal-benefit income items declare different serviceYears (${[...seen].sort((a, b) => a - b).join(', ')}). The table is selected once, for the whole terminal benefit, by the period of contribution or employment; how to select it when the periods differ — and how "period of employment" is measured across broken service — is not settled (Q32) and is not specified in docs/spec/calculation-engine.md. The engine will not guess.`,
    );
  }

  const [only] = seen;
  if (only === undefined) {
    // Unreachable: the caller only calls this when at least one item exists.
    throw new Error('resolveServiceYears called with no terminal-benefit items');
  }
  return only;
}

// ---------------------------------------------------------------------------
// Step 5 — the maximum-rate cap
// ---------------------------------------------------------------------------

/**
 * The cap that modifies the ladder this taxpayer sits on, or `null` if the year declares
 * none. Resolved by `appliesToSchedule`, because a cap in this data model *is* a
 * modification of a named schedule — there is no separate schedule to select.
 */
function resolveRateCap(
  ladderId: string,
  taxYear: TaxYearData,
): { capId: string; cap: RateCap } | null {
  const matches = Object.entries(taxYear.rateCaps).filter(
    ([, cap]) => cap.appliesToSchedule === ladderId,
  );

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      `${taxYear.yearOfAssessment} declares ${matches.length} rate caps on schedule "${ladderId}" (${matches.map(([id]) => id).join(', ')}). Which one a given amount of foreign-capped income falls under is not expressible in the current data model, and the engine will not pick one.`,
    );
  }

  const [only] = matches;
  if (!only) throw new Error('unreachable: matches.length === 1 but no entry');
  return { capId: only[0], cap: only[1] };
}

/**
 * Invariants on the cap itself, re-checked here because **the engine must not trust that
 * the schema ran** — a caller can hand it any object that satisfies the TypeScript type.
 *
 * The substantive one is the last: a `maxRateBp` at or above the schedule's top marginal
 * rate reduces nothing, so income the Act entitles to a capped rate would be charged the
 * full ladder. That is a silent **overcharge** produced by a data-entry error, and it is
 * the reason this throws instead of warning.
 */
function assertCapIsSane(
  capId: string,
  cap: RateCap,
  ladderId: string,
  schedule: RateSchedule,
): void {
  if (cap.appliesToSchedule !== ladderId) {
    throw new Error(
      `rateCaps.${capId} applies to schedule "${cap.appliesToSchedule}", but this computation runs on "${ladderId}". A cap is a modification of one named schedule; applying it to another would charge a rate no provision authorises.`,
    );
  }

  if (!Number.isInteger(cap.maxRateBp) || cap.maxRateBp < 0 || cap.maxRateBp > 10_000) {
    throw new Error(
      `rateCaps.${capId}.maxRateBp must be integer basis points 0-10000, got ${cap.maxRateBp}`,
    );
  }

  const topRateBp = Math.max(...schedule.bands.map((b) => b.rateBp));
  if (cap.maxRateBp >= topRateBp) {
    throw new Error(
      `rateCaps.${capId}.maxRateBp (${cap.maxRateBp} bp) is not below the top marginal rate (${topRateBp} bp) of schedule "${ladderId}". Such a cap reduces nothing, so income entitled to the maximum rate would be charged the full ladder — an overcharge produced by a data error rather than by law. The engine stops rather than compute on it [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)].`,
    );
  }
}

/**
 * Whether every condition the cap names is answered `true` for this item.
 *
 * Evaluated **first**, before any rate is applied [docs/spec/calculation-engine.md step
 * 5]. An unmet condition means the cap does not apply and the ladder stands unmodified;
 * `ifNotMet` is `null` and there is no fallback schedule to look up.
 *
 * An **unanswered** condition is not an unmet one. Defaulting it to `false` pushes a
 * consultant onto a 36% band they may not belong on; defaulting it to `true` undercharges
 * them. Both are plausible wrong answers, so neither is produced.
 */
function capConditionsMet(
  item: IncomeItem,
  capId: string,
  cap: RateCap,
  taxYear: TaxYearData,
): boolean {
  for (const conditionId of cap.conditions) {
    const condition = taxYear.conditions[conditionId];
    if (!condition) {
      throw new Error(
        `rateCaps.${capId} names condition "${conditionId}", which ${taxYear.yearOfAssessment} does not declare in conditions. The engine cannot evaluate a condition it cannot read.`,
      );
    }

    const answer = item.conditions?.[conditionId];
    if (answer === undefined) {
      throw new Error(
        `income item "${item.label}" is tagged "foreign-capped", so the maximum-rate cap "${capId}" turns on condition "${conditionId}", but the input gives no answer for it. The question is: "${condition.question}" An unanswered condition is not a "no" — defaulting it either way silently moves this income between ${cap.maxRateBp} bp and the full ladder. Answer it via IncomeItem.conditions["${conditionId}"].`,
      );
    }
    if (answer !== true) return false;
  }
  return true;
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

  // -- the ladder this taxpayer sits on ------------------------------------
  // Resolved before steps 4 and 5 because the cap is defined as a modification of a
  // *named schedule*, so the cap cannot be resolved until the schedule is.
  const { id: ladderId, schedule } = resolveLadder(input, taxYear);

  // -- step 4: carve the separately-rated components out of taxableMain -----
  // "only the remainder of the individual's taxable income shall be taxed at the rates
  // referred to in subparagraph (1)" [IRA Sch.1 para 1(2)(d), as enacted 2017].
  //
  // NOTE ON reliefEligible IN THE DATA. `separatelyRated[...].reliefEligible` is `false`
  // for terminal-benefit and special-business in the Y/A 2025/2026 file, but the
  // partition in step 2 is authoritative and it turns on `capital-gain` **only**
  // [docs/spec/calculation-engine.md steps 2 and 4]. So these two components are carved
  // out of taxableMain *after* the single Fifth Schedule deduction has been applied, and
  // that flag is simply not consulted by this step. The spec is followed, per CLAUDE.md;
  // the data is not wrong, it is unused here.
  const components: ResultComponent[] = [];
  const carveKinds = ['terminal-benefit', 'special-business'] as const;
  const present = carveKinds
    .map((kind) => ({ kind: kind as ComponentKind, gross: heads.taggedTotals[kind] }))
    .filter((c) => c.gross > 0);

  const grossCarve = sumMoney(
    present.map((c) => c.gross),
    'separately-rated components',
  );

  let carved: { kind: ComponentKind; amount: number }[];
  if (grossCarve <= taxableMain) {
    // The ordinary income absorbed the whole deduction; each component survives in full.
    carved = present.map((c) => ({ kind: c.kind, amount: c.gross }));
  } else if (present.length === 1 && present[0]) {
    // Only one component, so there is nothing to allocate between: it takes what is left
    // of taxable income after the deduction.
    carved = [{ kind: present[0].kind, amount: taxableMain }];
  } else {
    throw new Error(
      `the single Fifth Schedule deduction (${deductionTotal}) reduces taxable income to ${taxableMain}, below the ${grossCarve} total of the separately-rated components in this computation (${present.map((c) => c.kind).join(', ')}). How the shortfall is shared between two differently-rated components is not specified in docs/spec/calculation-engine.md, and the components carry different rates, so the answer depends on the allocation. The engine will not guess.`,
    );
  }

  const ladderAmount =
    taxableMain -
    sumMoney(
      carved.map((c) => c.amount),
      'carved components',
    );

  // -- step 5: the maximum-rate cap, condition first ------------------------
  const foreignTotal = heads.taggedTotals['foreign-capped'];
  let capApplied: { capId: string; cap: RateCap } | null = null;
  let cappedEligible = 0; // gross foreign-capped income meeting every condition

  if (foreignTotal > 0) {
    const resolved = resolveRateCap(ladderId, taxYear);
    if (!resolved) {
      warnings.push({
        code: WARNING_CODES.rateCapNotImplemented,
        severity: 'blocking',
        message: `This computation includes ${foreignTotal} rupees of income tagged for the maximum-rate cap [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)], but the ${taxYear.yearOfAssessment} data declares no rate cap on schedule "${ladderId}". That income was taxed at the full ladder rate, which overstates the liability if a cap in fact applies for this year. The engine will not supply a rate the data does not hold. Do not rely on this figure.`,
      });
    } else {
      assertCapIsSane(resolved.capId, resolved.cap, ladderId, schedule);

      let unmet = 0;
      for (const item of heads.taggedItems['foreign-capped']) {
        if (capConditionsMet(item, resolved.capId, resolved.cap, taxYear)) {
          cappedEligible += item.amount;
        } else {
          unmet += item.amount;
        }
      }

      if (cappedEligible > 0) capApplied = resolved;

      if (unmet > 0) {
        warnings.push({
          code: WARNING_CODES.rateCapConditionNotMet,
          severity: 'warn',
          message: `${unmet} rupees of foreign-currency income did not meet the condition(s) for the maximum-rate cap "${resolved.capId}" (${resolved.cap.conditions.join(', ')}). The cap therefore does not apply to it and the normal ladder stands unmodified — there is no reduced fallback schedule [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. That income was taxed at the full ladder rate.`,
        });
      }
    }
  }

  // -- step 5, ordering: the mixed case is refused, not guessed -------------
  // `reliefEligible` excludes capital gains already, so "everything else" here means
  // ordinary income, foreign income whose condition failed, and the separately-rated
  // components — all of which draw on the same deduction and, but for the carve-out,
  // the same ladder.
  const otherReliefEligible = reliefEligible - cappedEligible;
  if (otherReliefEligible < 0) {
    // Unreachable: cappedEligible is a subset of the relief-eligible pool. Defensive.
    throw new Error(
      `partition inconsistency: capped income (${cappedEligible}) exceeds relief-eligible income (${reliefEligible})`,
    );
  }

  if (capApplied && cappedEligible > 0 && otherReliefEligible > 0 && ladderAmount > 0) {
    // Two unresolved questions at once: how the single Fifth Schedule deduction divides
    // between the capped and uncapped pools, and which pool occupies the lower bands.
    // Both change the answer materially, and the Act settles neither.
    //
    // Note the two cases this does NOT catch, correctly: a taxpayer whose only other
    // income is a capital gain (the gain never touches this ladder, so there is nothing
    // to order), and a taxpayer whose deduction wipes out taxable income entirely (every
    // ordering gives zero).
    return {
      yearOfAssessment: taxYear.yearOfAssessment,
      assessableByHead: heads.assessableByHead,
      partition: { reliefEligible, reliefIneligible },
      deduction: { personalRelief, qualifyingPayments, total: deductionTotal },
      taxableMain,
      taxableGain,
      // Empty, not zeroed-out working: no computation was performed, so there is nothing
      // to show. See the refusal contract on `TaxResult`.
      components: [],
      grossTax: 0,
      credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 },
      taxPayable: 0,
      schedule: { instalments: [], finalPayment: { due: '', amount: 0 }, returnDue: '' },
      refusals: [
        {
          code: REFUSAL_CODES.mixedCappedAndUncapped,
          question: 'Q14',
          explanation: `This computation has ${cappedEligible} rupees of income entitled to the maximum rate under the cap "${capApplied.capId}" and ${otherReliefEligible} rupees that is not, and both sit on the same schedule ("${ladderId}"). The maximum rate is imposed notwithstanding the normal ladder [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)], but the Act does not say which of the two occupies the lower bands, nor how the single Fifth Schedule deduction [IRA s.52(1)] divides between them. The orderings give materially different liabilities, so no figure has been computed for this case — a plausible one would be a guess presented as an answer. See Q14 in docs/research/12-open-questions.md; the Y/A 2025/2026 return form is the most likely thing to settle it. Take this computation to a qualified tax practitioner or to IRD.`,
        },
      ],
      warnings,
      sourcesUsed,
    };
  }

  // Everything below this point is unambiguous: either there is no capped income, or
  // there is nothing else on the ladder for it to be ordered against.
  const cappedAmount = capApplied && cappedEligible > 0 ? ladderAmount : 0;
  const plainLadderAmount = ladderAmount - cappedAmount;

  // -- step 6: walk the ladder, capped and uncapped -------------------------
  let scheduleWasApplied = false;

  if (plainLadderAmount > 0 || cappedAmount === 0) {
    const ladderBands = walkBands(plainLadderAmount, schedule.bands);
    for (const band of ladderBands) noteSource(band.src);
    if (ladderBands.length > 0) scheduleWasApplied = true;

    components.push({
      kind: 'ladder',
      amount: plainLadderAmount,
      bands: ladderBands,
      tax: sumMoney(
        ladderBands.map((b) => b.tax),
        'ladder tax',
      ),
    });
  }

  if (capApplied && cappedAmount > 0) {
    const { capId, cap } = capApplied;
    // The SAME ladder, with each band's rate capped. Not a second table.
    const cappedBands = walkBands(cappedAmount, schedule.bands, cap.maxRateBp);
    assertWithinCap(cappedBands, cap.maxRateBp, `rateCaps.${capId}`);
    for (const band of cappedBands) noteSource(band.src);
    noteSource(cap.src);
    if (cappedBands.length > 0) scheduleWasApplied = true;

    components.push({
      kind: 'capped',
      amount: cappedAmount,
      conditionsMet: true,
      bands: cappedBands,
      tax: sumMoney(
        cappedBands.map((b) => b.tax),
        'capped tax',
      ),
    });

    if (cappedBands.length > 0 && !cap.verified) {
      warnings.push({
        code: WARNING_CODES.unverifiedRate,
        severity: 'warn',
        message: `Rate cap "${capId}" (${cap.label}) is marked verified: false in the ${taxYear.yearOfAssessment} data. The maximum rate of ${cap.maxRateBp} bp was applied to ${cappedAmount} rupees, from a value that has not been confirmed against a primary source.`,
      });
    }
  }

  if (scheduleWasApplied && !schedule.verified) {
    warnings.push({
      code: WARNING_CODES.unverifiedRate,
      severity: 'warn',
      message: `Rate schedule "${ladderId}" (${schedule.label}) is marked verified: false in the ${taxYear.yearOfAssessment} data. The figure below was computed from a rate that has not been confirmed against a primary source.`,
    });
  }

  // -- step 4, continued: rate each carved component on its own basis -------
  const ratable: { kind: ComponentKind; amount: number }[] = [...carved];
  if (taxableGain > 0) ratable.push({ kind: 'capital-gain', amount: taxableGain });

  for (const { kind, amount } of ratable) {
    const definition = taxYear.separatelyRated[kind];

    if (!definition) {
      // The year holds no rate for this component. Record it, charge nothing, and say
      // loudly that the total is incomplete — a silent zero in a tax column reads as
      // "nothing due", which is the plausible wrong answer this engine exists to avoid.
      components.push({ kind, amount, bands: [], tax: 0 });
      warnings.push({
        code: WARNING_CODES.componentNotImplemented,
        severity: 'blocking',
        message: `This computation includes ${amount} rupees of "${kind}" income, which the Act rates separately [IRA Sch.1 para 1(2), as enacted 2017], but the ${taxYear.yearOfAssessment} data declares no rate for it under separatelyRated. No tax has been charged on it, so the figure shown is incomplete and understates the liability. The engine will not supply a rate the data does not hold. Do not rely on it.`,
      });
      continue;
    }

    let bands: ResultBand[];

    if (kind === 'terminal-benefit') {
      if (!isSelectorTable(definition)) {
        throw new Error(
          `separatelyRated["terminal-benefit"] in ${taxYear.yearOfAssessment} is a flat rate, but terminal benefits are rated on tables selected by length of service [IRA Sch.1 para 1(2)(b), as enacted 2017]. The engine will not substitute a flat rate for the tables.`,
        );
      }
      if (definition.selector.field !== 'serviceYears') {
        throw new Error(
          `separatelyRated["terminal-benefit"].selector.field is "${definition.selector.field}" in ${taxYear.yearOfAssessment}; the only selector this engine can evaluate is "serviceYears". Extend the schema and the engine deliberately rather than let an unknown selector silently pick a table.`,
        );
      }

      const years = resolveServiceYears(heads.taggedItems['terminal-benefit']);
      // "20 years or less" vs "more than 20 years" [IRA Sch.1 para 1(2)(b)(i)–(ii),
      // as enacted 2017]: the threshold year itself sits on the atOrBelow table.
      const table =
        years <= definition.selector.thresholdYears
          ? definition.tablesBySelector.atOrBelow
          : definition.tablesBySelector.above;

      bands = walkBands(amount, table);
    } else {
      if (isSelectorTable(definition)) {
        throw new Error(
          `separatelyRated["${kind}"] in ${taxYear.yearOfAssessment} declares selector tables, but this engine rates "${kind}" at a flat rate. The engine will not choose a table for a component the spec rates flat.`,
        );
      }
      bands =
        amount > 0
          ? [
              {
                amount,
                rateBp: definition.rateBp,
                effectiveRateBp: definition.rateBp,
                tax: taxOnAmount(amount, definition.rateBp),
                src: definition.src,
              },
            ]
          : [];
    }

    for (const band of bands) noteSource(band.src);

    components.push({
      kind,
      amount,
      bands,
      tax: sumMoney(
        bands.map((b) => b.tax),
        `${kind} tax`,
      ),
    });

    if (bands.length > 0 && !definition.verified) {
      warnings.push({
        code: WARNING_CODES.unverifiedRate,
        severity: 'warn',
        message: `The separately-rated component "${kind}" (${definition.label}) is marked verified: false in the ${taxYear.yearOfAssessment} data. ${amount} rupees was charged from a rate that has not been confirmed against a primary source, and this figure should not be relied on until it is.`,
      });
    }
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
    refusals: [],
    warnings,
    sourcesUsed,
  };
}

/**
 * The worked-example fixture format: reading `docs/worked-examples/*.md`, validating the
 * YAML front matter, and resolving each fixture to the tax-year data it runs against.
 *
 * `src/lib/tax/fixtures.test.ts` is the harness that consumes this. This module holds no
 * assertions — it exists so that the *shape* of a fixture is validated once, strictly,
 * with an error a fixture author can act on, rather than being destructured field by
 * field inside a test where a missing key reads as `undefined` and quietly asserts
 * nothing.
 *
 * ## Why the format is what it is
 *
 * `input` maps **directly** onto `TaxInput` and `expected` mirrors `TaxResult`. That is
 * the whole design. `toTaxInput` below is a one-line function returning its argument, and
 * its type signature is a compile-time proof that a parsed fixture *is* engine input:
 * there is no translation layer between the document and the engine, so a fixture cannot
 * be right about a vocabulary that the engine does not speak.
 *
 * The format `docs/worked-examples/README.md` carried before P07 did have such a layer —
 * `schedule: service-export-foreign` on an income item, `bandBreakdown`, `taxableIncome`,
 * `reliefsApplied` — invented before the engine existed, and matching nothing in it. The
 * README is corrected; see the correction note there.
 *
 * ## Strictness is the point
 *
 * Every object below is strict. A misspelled key is a parse error, never a silently
 * skipped assertion — `taxPaybale: 0` must fail loudly, because a fixture that asserts
 * nothing passes forever and reads exactly like one that asserts everything.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import {
  INCOME_TAGS,
  type ComponentKind,
  type Residency,
  type TaxInput,
  type TaxYearData,
} from './engine';
import { loadTaxYears } from './load';

// ---------------------------------------------------------------------------
// The engine's string unions, as values a Zod enum can be built from
// ---------------------------------------------------------------------------

/**
 * Built from a `Record` keyed by the engine's own union rather than written out as a
 * plain array, so the compiler enforces the list **both ways**: a residency added to the
 * engine and not listed here fails to compile (missing key), and one listed here that the
 * engine does not have fails too (excess key). A hand-kept copy of a union drifts, and a
 * drifted copy here would reject a valid fixture — or, worse, accept an invalid one.
 */
const RESIDENCY_KEYS: Record<Residency, true> = {
  resident: true,
  'non-resident-citizen': true,
  'non-resident': true,
};
const RESIDENCIES = Object.keys(RESIDENCY_KEYS) as [Residency, ...Residency[]];

const COMPONENT_KIND_KEYS: Record<ComponentKind, true> = {
  ladder: true,
  capped: true,
  'capital-gain': true,
  'terminal-benefit': true,
  'special-business': true,
};
const COMPONENT_KINDS = Object.keys(COMPONENT_KIND_KEYS) as [
  ComponentKind,
  ...ComponentKind[],
];

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

/** src/lib/tax/fixtures.ts -> src/lib/tax -> src/lib -> src -> <repo root> -> docs/... */
export const WORKED_EXAMPLES_DIR = fileURLToPath(
  new URL('../../../docs/worked-examples/', import.meta.url),
);

/**
 * Files in `docs/worked-examples/` that are documentation rather than fixtures.
 *
 * `README.md` in particular contains a fenced example whose body begins with `---`, so a
 * front-matter reader pointed at it would parse the *illustration* as a fixture.
 */
const NOT_FIXTURES = new Set(['README.md']);

// ---------------------------------------------------------------------------
// Year of assessment -> data file
// ---------------------------------------------------------------------------

/**
 * `"2025/2026"` -> `"2025-26.json"`.
 *
 * Written out rather than pattern-matched loosely, because a mis-mapping here does not
 * fail — it silently computes a real answer for the **wrong year**, which is the one
 * failure mode a tax tool cannot survive [CLAUDE.md rule 5]. So:
 *
 *   - the string must be exactly `YYYY/YYYY`, and
 *   - the second year must be the first plus one — Sri Lanka's year of assessment runs
 *     1 April to 31 March, so `"2025/2027"` is not a year of assessment at all, and
 *   - the short form is the *end* year's last two digits, zero-padded, so the turn of a
 *     century (`"2099/2100"` -> `"2099-00.json"`) maps by the same rule as every other
 *     year rather than by an accident of string slicing.
 *
 * The filename is then cross-checked against the loaded file's own `yearOfAssessment`
 * (see `taxYearFor`), so a repo that ever renames its data files fails loudly here
 * instead of quietly running a fixture against a neighbouring year.
 */
export function taxYearDataFileName(yearOfAssessment: string): string {
  const match = /^(\d{4})\/(\d{4})$/.exec(yearOfAssessment);
  if (!match?.[1] || !match[2]) {
    throw new Error(
      `yearOfAssessment must be written "YYYY/YYYY" — Sri Lanka's year of assessment runs 1 April to 31 March, so it spans two calendar years. Got ${JSON.stringify(yearOfAssessment)}.`,
    );
  }
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (end !== start + 1) {
    throw new Error(
      `yearOfAssessment "${yearOfAssessment}" does not name a single year of assessment: it ends in ${end}, but a year of assessment beginning in ${start} ends in ${start + 1}.`,
    );
  }
  return `${start}-${String(end % 100).padStart(2, '0')}.json`;
}

// ---------------------------------------------------------------------------
// Primitives — the same money and rate rules the tax data itself is held to
// ---------------------------------------------------------------------------

/**
 * Money in front matter, as `docs/worked-examples/README.md` requires it: integer rupees,
 * no separators, no decimals, no currency symbol.
 *
 * The "received a string" message is not incidental. YAML 1.2 reads `1_800_000` and
 * `"1,800,000"` as *strings*, not numbers, so the no-separators rule is enforced by the
 * parser rather than by proofreading — and the message has to say so, or an author sees
 * only "expected number, received string" against a line that looks like a number.
 */
const MONEY_MESSAGE =
  'amounts must be integer rupees: no thousands separators, no decimals, no currency symbol. YAML reads 1_800_000 and "1,800,000" as text rather than as numbers, so write 1800000.';

const rupees = z
  .number({ error: MONEY_MESSAGE })
  .int(MONEY_MESSAGE)
  .nonnegative('amounts must not be negative');

/** A rupee amount that may be negative: `finalPayment.amount` is signed, because an
 * overpayment is a real answer and clamping it would hide one. */
const signedRupees = z.number({ error: MONEY_MESSAGE }).int(MONEY_MESSAGE);

const basisPoints = z
  .number()
  .int('rates are integer basis points — 6% is 600, 15% is 1500')
  .min(0)
  .max(10000);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected an ISO date in YYYY-MM-DD form');

// ---------------------------------------------------------------------------
// `input` — mirrors TaxInput exactly
// ---------------------------------------------------------------------------

const incomeItemSchema = z.strictObject({
  label: z.string().min(1),
  amount: rupees,
  tags: z.array(z.enum(INCOME_TAGS)).optional(),
  serviceYears: z.number().int().nonnegative().optional(),
  conditions: z.record(z.string().min(1), z.boolean()).optional(),
  foreignTax: z
    .strictObject({
      paid: rupees,
      paidOn: isoDate,
    })
    .optional(),
});

const incomeByHeadSchema = z.strictObject({
  employment: z.array(incomeItemSchema).optional(),
  business: z.array(incomeItemSchema).optional(),
  investment: z.array(incomeItemSchema).optional(),
  other: z.array(incomeItemSchema).optional(),
});

const deductionsSchema = z.strictObject({
  employment: rupees.optional(),
  business: rupees.optional(),
  investment: rupees.optional(),
  other: rupees.optional(),
});

const inputSchema = z.strictObject({
  residency: z.enum(RESIDENCIES),
  income: incomeByHeadSchema,
  deductions: deductionsSchema.optional(),
  qualifyingPayments: rupees.optional(),
  /**
   * No `foreign` key. The foreign tax credit is calculated separately for each source and
   * for each gain [IRA s.81(1)], so it is attached to the income it was paid on
   * (`income.<head>[].foreignTax`) and never supplied as one aggregate figure. The engine
   * throws on `creditsPaid.foreign`; rejecting it here turns that into a parse error
   * naming the field to use instead, which is the error an author copying the old README
   * example would otherwise hit at runtime.
   */
  creditsPaid: z
    .strictObject({ apit: rupees.optional(), ait: rupees.optional() })
    .optional(),
  estimatedTaxForInstalments: rupees.optional(),
  scheduleId: z.string().min(1).optional(),
});

// ---------------------------------------------------------------------------
// `expected` — mirrors TaxResult
// ---------------------------------------------------------------------------

const expectedBandSchema = z.strictObject({
  amount: rupees,
  rateBp: basisPoints,
  /** The rate actually charged: `min(rateBp, cap.maxRateBp)` under a cap, `rateBp`
   * otherwise. Required even where it equals `rateBp`, so that a fixture states whether a
   * cap bit rather than leaving it to be inferred. */
  effectiveRateBp: basisPoints,
  tax: rupees,
  /** Optional. Given, it pins which provision the band came from and is asserted. */
  src: z.string().min(1).optional(),
});

const expectedComponentSchema = z.strictObject({
  kind: z.enum(COMPONENT_KINDS),
  amount: rupees,
  conditionsMet: z.boolean().optional(),
  bands: z.array(expectedBandSchema),
  tax: rupees,
});

const assessableByHeadSchema = z.strictObject({
  employment: rupees,
  business: rupees,
  investment: rupees,
  other: rupees,
});

/**
 * A warning the computation is expected to raise, by code. Either the bare code or the
 * code with its severity — the severity is worth stating on a `blocking` warning, which
 * means the figure beside it is incomplete.
 *
 * Codes, not messages: the messages are long, and pinning their prose in a fixture would
 * make every wording improvement look like a tax error.
 */
const expectedWarningSchema = z.union([
  z.string().min(1),
  z.strictObject({
    code: z.string().min(1),
    severity: z.enum(['info', 'warn', 'blocking']).optional(),
  }),
]);

const computedExpectedSchema = z.strictObject({
  assessableByHead: assessableByHeadSchema,
  partition: z.strictObject({ reliefEligible: rupees, reliefIneligible: rupees }),
  deduction: z.strictObject({
    personalRelief: rupees,
    qualifyingPayments: rupees,
    total: rupees,
  }),
  taxableMain: rupees,
  taxableGain: rupees,
  components: z.array(expectedComponentSchema),
  grossTax: rupees,
  credits: z.strictObject({
    apit: rupees,
    ait: rupees,
    foreign: rupees,
    total: rupees,
    excess: rupees,
  }),
  taxPayable: rupees,
  schedule: z.strictObject({
    instalments: z.array(
      z.strictObject({
        quarter: z.number().int().positive(),
        due: isoDate,
        amount: rupees,
      }),
    ),
    /** `due` may be `''`: whether a final payment date exists separately from the last
     * instalment is Q22, unverified, and the engine states no date it cannot cite. */
    finalPayment: z.strictObject({ due: z.string(), amount: signedRupees }),
    returnDue: isoDate,
  }),
  /** Required, not optional. An undeclared warning list would let a `blocking` warning —
   * "this figure is incomplete" — arrive unnoticed beside a fixture full of ticks. */
  warnings: z.array(expectedWarningSchema),
  sourcesUsed: z.array(z.string().min(1)).optional(),
});

const refusalExpectedSchema = z.strictObject({
  /**
   * The fixture asserts that the engine produced **no figure**. See `TaxResult.refusals`
   * and `isRefusal`.
   */
  refusal: z.strictObject({
    code: z.string().min(1),
    /** The open question, e.g. `"Q14"`, in `docs/research/12-open-questions.md`. */
    question: z.string().min(1),
  }),
  // The income fields remain meaningful on a refusal — they are what the taxpayer
  // entered, computed up to the point the law runs out — so they are still asserted.
  assessableByHead: assessableByHeadSchema,
  partition: z.strictObject({ reliefEligible: rupees, reliefIneligible: rupees }),
  deduction: z.strictObject({
    personalRelief: rupees,
    qualifyingPayments: rupees,
    total: rupees,
  }),
  taxableMain: rupees,
  taxableGain: rupees,
  warnings: z.array(expectedWarningSchema),
  sourcesUsed: z.array(z.string().min(1)).optional(),
});

/** Fields that state a figure. None of them may appear beside `refusal`. */
const FIGURE_KEYS = [
  'components',
  'grossTax',
  'credits',
  'taxPayable',
  'schedule',
] as const;

const frontMatterSchema = z
  .strictObject({
    /** Must equal the filename without `.md`. */
    id: z.string().min(1),
    persona: z.string().min(1).optional(),
    yearOfAssessment: z.string().min(1),
    /** `true` only when every rate this computation actually applies has been verified
     * against a primary source in `docs/sources/`. */
    verified: z.boolean(),
    /** Required when `verified` is `false`: which rate or question is unresolved, so the
     * harness can name it in the report rather than printing a bare count. */
    unverifiedBecause: z.string().min(1).optional(),
    input: inputSchema,
    expected: z.record(z.string(), z.unknown()),
  })
  .superRefine((value, ctx) => {
    if (!value.verified && value.unverifiedBecause === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['unverifiedBecause'],
        message:
          'a fixture marked verified: false must say why — name the rate that is unverified or superseded, and the open question (e.g. "capital gains rate is the 2017 figure, superseded, Q42"). The harness reports unverified fixtures separately and prints this text; a bare count tells a maintainer nothing about which number not to trust.',
      });
    }
  });

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type FixtureInput = z.infer<typeof inputSchema>;
export type ComputedExpectation = z.infer<typeof computedExpectedSchema>;
export type RefusalExpectation = z.infer<typeof refusalExpectedSchema>;
export type FixtureExpectation = ComputedExpectation | RefusalExpectation;
export type ExpectedWarning = z.infer<typeof expectedWarningSchema>;

export interface Fixture {
  /** Filename, e.g. `p2-below-relief-threshold-2025-26.md`. */
  file: string;
  id: string;
  persona?: string;
  yearOfAssessment: string;
  verified: boolean;
  unverifiedBecause?: string;
  input: FixtureInput;
  expected: FixtureExpectation;
}

/** Narrowing helper: does this fixture assert a refusal rather than a figure? */
export function expectsRefusal(
  expected: FixtureExpectation,
): expected is RefusalExpectation {
  return 'refusal' in expected;
}

/**
 * A parsed fixture's `input` **is** engine input.
 *
 * The signature is the point: if the fixture schema and `TaxInput` ever drift apart, this
 * stops compiling. There is deliberately no field mapping in the body — a translation
 * layer between the document and the engine is how a fixture ends up correct in a
 * vocabulary nothing else uses.
 */
export function toTaxInput(fixture: Fixture): TaxInput {
  return fixture.input;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function formatIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
): string {
  return issues
    .map((issue) => {
      const at = issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)';
      return `  - ${at}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Split the YAML front matter off a markdown file.
 *
 * Deliberately a real YAML parser rather than a line reader: front matter carries block
 * scalars, quoted strings containing `---`, and flow mappings, and a hand-rolled splitter
 * that gets any of those wrong mis-reads a *number on a tax return*.
 */
export function parseFrontMatter(content: string, file: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(content);
  if (!match?.[1]) {
    throw new Error(
      `${file}: no YAML front matter found. A worked example is consumed verbatim as a test fixture and must open with a "---" delimited front-matter block — see docs/worked-examples/README.md.`,
    );
  }
  try {
    return parseYaml(match[1]);
  } catch (err) {
    throw new Error(`${file}: front matter is not valid YAML\n${String(err)}`, {
      cause: err,
    });
  }
}

function parseExpected(raw: unknown, file: string): FixtureExpectation {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${file}: expected must be a mapping`);
  }
  const asRecord = raw as Record<string, unknown>;

  if ('refusal' in asRecord) {
    for (const key of FIGURE_KEYS) {
      if (key in asRecord) {
        throw new Error(
          `${file}: expected.refusal is set and expected.${key} is also set. A refusal means **no figure was produced** — grossTax, taxPayable, credits and schedule are zeroed placeholders on that path and components is empty, so asserting them would record a placeholder as an answer. Remove expected.${key}; the income fields (assessableByHead, partition, deduction, taxableMain, taxableGain) are the ones that remain meaningful [docs/spec/calculation-engine.md, "Result shape"].`,
        );
      }
    }
    const result = refusalExpectedSchema.safeParse(asRecord);
    if (!result.success) {
      throw new Error(
        `${file}: expected block (refusal) failed validation, ${result.error.issues.length} issue(s):\n${formatIssues(result.error.issues)}`,
      );
    }
    return result.data;
  }

  const result = computedExpectedSchema.safeParse(asRecord);
  if (!result.success) {
    throw new Error(
      `${file}: expected block failed validation, ${result.error.issues.length} issue(s):\n${formatIssues(result.error.issues)}`,
    );
  }
  return result.data;
}

/** Parse one fixture from a file's raw contents. Throws with the filename on any problem. */
export function parseFixture(content: string, file: string): Fixture {
  const frontMatter = parseFrontMatter(content, file);

  const outer = frontMatterSchema.safeParse(frontMatter);
  if (!outer.success) {
    throw new Error(
      `${file}: front matter failed validation, ${outer.error.issues.length} issue(s):\n${formatIssues(outer.error.issues)}`,
    );
  }

  const expectedId = file.replace(/\.md$/, '');
  if (outer.data.id !== expectedId) {
    throw new Error(
      `${file}: front-matter id is "${outer.data.id}" but the filename says "${expectedId}". The id names the fixture in the test report; two files sharing one id make a failure impossible to trace back to a document.`,
    );
  }

  // Validated here rather than at use, so a malformed year of assessment is a parse
  // error on the document rather than a confusing "file not found" during the run.
  taxYearDataFileName(outer.data.yearOfAssessment);

  const fixture: Fixture = {
    file,
    id: outer.data.id,
    yearOfAssessment: outer.data.yearOfAssessment,
    verified: outer.data.verified,
    input: outer.data.input,
    expected: parseExpected(outer.data.expected, file),
  };
  if (outer.data.persona !== undefined) fixture.persona = outer.data.persona;
  if (outer.data.unverifiedBecause !== undefined) {
    fixture.unverifiedBecause = outer.data.unverifiedBecause;
  }
  return fixture;
}

/**
 * Every fixture document in `docs/worked-examples/`, in filename order.
 *
 * Listing is separate from parsing so the harness can report a fixture that fails to
 * *parse* as its own failing test, naming the file. Parsing them all in one call would
 * make the first malformed document abort collection and hide every fixture after it.
 */
export function listFixtureFiles(dir: string = WORKED_EXAMPLES_DIR): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !NOT_FIXTURES.has(name))
    .sort();
}

/** Read and parse one fixture document by filename. */
export function readFixture(file: string, dir: string = WORKED_EXAMPLES_DIR): Fixture {
  return parseFixture(readFileSync(path.join(dir, file), 'utf-8'), file);
}

/**
 * Every fixture in `docs/worked-examples/`, in filename order.
 *
 * An empty directory is not an error here — but it is in the harness, which asserts the
 * list is non-empty, so a suite cannot go green by finding nothing to run.
 */
export function loadFixtures(dir: string = WORKED_EXAMPLES_DIR): Fixture[] {
  return listFixtureFiles(dir).map((file) => readFixture(file, dir));
}

/**
 * The tax-year data a fixture runs against, loaded and schema-validated through the same
 * `loadTaxYears` path the site uses — so a fixture can never assert behaviour on data the
 * loader would have rejected.
 */
export function taxYearFor(fixture: Fixture): TaxYearData {
  const wanted = taxYearDataFileName(fixture.yearOfAssessment);
  const years = loadTaxYears();
  const found = years.find((y) => y.file === wanted);

  if (!found) {
    throw new Error(
      `${fixture.file}: no tax-year data file "${wanted}" for Y/A ${fixture.yearOfAssessment} (data/tax-years/ holds: ${years.map((y) => y.file).join(', ') || 'nothing'}). The engine resolves every rate from the year it is given [CLAUDE.md rule 5]; there is no fallback year to run this against.`,
    );
  }

  if (found.data.yearOfAssessment !== fixture.yearOfAssessment) {
    throw new Error(
      `${fixture.file}: data file "${wanted}" declares yearOfAssessment "${found.data.yearOfAssessment}", but the fixture is for "${fixture.yearOfAssessment}". Refusing to compute: a fixture run against the wrong year's rates produces a real-looking figure that is wrong for the year it claims.`,
    );
  }

  return found.data;
}

/**
 * The fixture harness (P07) — `docs/worked-examples/*.md` run as the engine's test suite.
 *
 * Each worked example is a document a human can check by eye and, at the same time, a
 * fixture the engine is asserted against **field by field**. Asserting only `taxPayable`
 * lets two compensating errors through, so every field of `TaxResult` a fixture declares
 * is compared, down to the band breakdown, the credits, and the payment schedule
 * [docs/prompts/P07-fixture-harness.md; docs/spec/calculation-engine.md, "Testing"].
 *
 * ## Three things this file does that a plain "run the fixtures" harness would not
 *
 * **1. It reports verified and unverified fixtures separately, every run.** A fixture
 * whose figure comes from a rate the data marks `verified: false` — the capital gains rate
 * and the terminal benefit tables, both 2017 text, both known superseded — is not a
 * passing test. It is a wrong answer with a tick next to it. So the two populations sit in
 * separate suites, the counts are in the suite names, and an unverified fixture prints its
 * reason in the summary at the end of the run.
 *
 * **2. It cross-checks the `verified` flag against what the engine actually applied.** A
 * fixture cannot claim `verified: true` while its computation raised an `unverified-rate`
 * warning. That claim is otherwise unfalsifiable prose in a front matter block, and it is
 * exactly the claim that decays.
 *
 * **3. It checks each fixture's own arithmetic, separately from the engine.** The bands
 * must sum to the component tax, the components to the gross tax, and the instalments plus
 * the final payment to the tax payable — asserted against the *document's own* numbers,
 * not the engine's. A fixture whose figures do not add up is a broken document, and it is
 * reported as one rather than as an engine failure.
 *
 * ## When a fixture and the engine disagree
 *
 * One of them is wrong, and which one is a question to answer before touching either.
 * Editing the expectation until the suite is green is how a broken engine ships with a
 * full set of ticks [docs/prompts/P07-fixture-harness.md, "Do not"].
 */

import { afterAll, describe, expect, it } from 'vitest';
import {
  WARNING_CODES,
  computeTax,
  isRefusal,
  type TaxResult,
  type TaxYearData,
} from './engine';
import {
  WORKED_EXAMPLES_DIR,
  expectsRefusal,
  listFixtureFiles,
  parseFixture,
  parseFrontMatter,
  readFixture,
  taxYearDataFileName,
  taxYearFor,
  toTaxInput,
  type ComputedExpectation,
  type ExpectedWarning,
  type Fixture,
  type RefusalExpectation,
} from './fixtures';

// ---------------------------------------------------------------------------
// Load every fixture, keeping parse failures as failures rather than as a crash
// ---------------------------------------------------------------------------

const FILES = listFixtureFiles();

const loaded: { file: string; fixture: Fixture }[] = [];
const unparsable: { file: string; error: unknown }[] = [];

for (const file of FILES) {
  try {
    loaded.push({ file, fixture: readFixture(file) });
  } catch (error) {
    unparsable.push({ file, error });
  }
}

const FIXTURES = loaded.map((entry) => entry.fixture);
const VERIFIED = FIXTURES.filter((f) => f.verified);
const UNVERIFIED = FIXTURES.filter((f) => !f.verified);

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function codeOf(warning: ExpectedWarning): string {
  return typeof warning === 'string' ? warning : warning.code;
}

/**
 * Warnings are asserted by **code, in the engine's emission order** — never by message.
 * The messages are long and are meant to be improved; pinning their prose in a fixture
 * would make every wording change look like a tax error. The codes are the contract, and
 * a warning the fixture did not declare is a finding about the computation, not a
 * formatting difference.
 */
function assertWarnings(result: TaxResult, expected: readonly ExpectedWarning[]): void {
  expect(result.warnings.map((w) => w.code)).toEqual(expected.map(codeOf));

  expected.forEach((warning, i) => {
    if (typeof warning !== 'string' && warning.severity !== undefined) {
      expect(result.warnings[i]?.severity).toBe(warning.severity);
    }
  });
}

function assertSourcesUsed(result: TaxResult, expected: readonly string[]): void {
  // Order is an implementation detail of the pipeline; membership is not.
  expect([...result.sourcesUsed].sort()).toEqual([...expected].sort());
}

/** Everything a computed (non-refusal) fixture asserts about `TaxResult`. */
function assertComputed(
  fixture: Fixture,
  expected: ComputedExpectation,
  result: TaxResult,
): void {
  expect(isRefusal(result)).toBe(false);
  expect(result.refusals).toEqual([]);
  expect(result.yearOfAssessment).toBe(fixture.yearOfAssessment);

  // -- steps 1 to 3 --------------------------------------------------------
  expect(result.assessableByHead).toEqual(expected.assessableByHead);
  expect(result.partition).toEqual(expected.partition);
  expect(result.deduction).toEqual(expected.deduction);
  expect(result.taxableMain).toBe(expected.taxableMain);
  expect(result.taxableGain).toBe(expected.taxableGain);

  // -- steps 4 to 6: every component, and every band inside it -------------
  // The kinds first, in order: when a component is missing or an extra one appears, this
  // says which, instead of failing on a field of the wrong component.
  expect(result.components.map((c) => c.kind)).toEqual(
    expected.components.map((c) => c.kind),
  );

  expected.components.forEach((expectedComponent, i) => {
    const actual = result.components[i];
    expect(
      actual,
      `components[${i}] (${expectedComponent.kind}) is missing`,
    ).toBeDefined();
    if (!actual) return;

    expect(actual.amount, `components[${i}].amount`).toBe(expectedComponent.amount);
    expect(actual.tax, `components[${i}].tax`).toBe(expectedComponent.tax);

    if (expectedComponent.conditionsMet !== undefined) {
      expect(actual.conditionsMet, `components[${i}].conditionsMet`).toBe(
        expectedComponent.conditionsMet,
      );
    }

    // The band breakdown, without `src` — which is compared only where the fixture
    // states it, since a fixture pinning the provision is useful but the long src
    // strings are not worth requiring on every band.
    expect(
      actual.bands.map(({ amount, rateBp, effectiveRateBp, tax }) => ({
        amount,
        rateBp,
        effectiveRateBp,
        tax,
      })),
      `components[${i}].bands`,
    ).toEqual(
      expectedComponent.bands.map(({ amount, rateBp, effectiveRateBp, tax }) => ({
        amount,
        rateBp,
        effectiveRateBp,
        tax,
      })),
    );

    expectedComponent.bands.forEach((band, j) => {
      if (band.src !== undefined) {
        expect(actual.bands[j]?.src, `components[${i}].bands[${j}].src`).toBe(band.src);
      }
    });
  });

  expect(result.grossTax).toBe(expected.grossTax);

  // -- step 7 --------------------------------------------------------------
  expect(result.credits).toEqual(expected.credits);
  expect(result.taxPayable).toBe(expected.taxPayable);

  // -- step 8 --------------------------------------------------------------
  expect(result.schedule.instalments).toEqual(expected.schedule.instalments);
  expect(result.schedule.finalPayment).toEqual(expected.schedule.finalPayment);
  expect(result.schedule.returnDue).toBe(expected.schedule.returnDue);

  assertWarnings(result, expected.warnings);
  if (expected.sourcesUsed) assertSourcesUsed(result, expected.sourcesUsed);
}

/**
 * Everything a refusal fixture asserts.
 *
 * No numeric field of the result beyond the income steps is touched: on a refusal
 * `grossTax`, `taxPayable`, `credits` and `schedule` are zeroed placeholders, and
 * asserting a placeholder equals zero would record "no answer" as "nil tax". The fixture
 * format rejects those keys outright next to `refusal`, so this cannot be reached with
 * them present.
 */
function assertRefusal(
  fixture: Fixture,
  expected: RefusalExpectation,
  result: TaxResult,
): void {
  expect(isRefusal(result)).toBe(true);
  expect(result.refusals).toHaveLength(1);
  expect(result.refusals[0]?.code).toBe(expected.refusal.code);
  expect(result.refusals[0]?.question).toBe(expected.refusal.question);
  // A refusal that carries no explanation sends the user nowhere.
  expect(result.refusals[0]?.explanation.length ?? 0).toBeGreaterThan(0);

  // No working was produced, so there is none to show.
  expect(result.components).toEqual([]);

  expect(result.yearOfAssessment).toBe(fixture.yearOfAssessment);
  expect(result.assessableByHead).toEqual(expected.assessableByHead);
  expect(result.partition).toEqual(expected.partition);
  expect(result.deduction).toEqual(expected.deduction);
  expect(result.taxableMain).toBe(expected.taxableMain);
  expect(result.taxableGain).toBe(expected.taxableGain);

  assertWarnings(result, expected.warnings);
  if (expected.sourcesUsed) assertSourcesUsed(result, expected.sourcesUsed);
}

/**
 * The document's own arithmetic, checked without reference to the engine — the machine
 * form of the self-check list in `docs/worked-examples/README.md`.
 *
 * This is what catches a worked example whose prose and front matter disagree with each
 * other. Such a fixture would otherwise fail against the engine and look like an engine
 * defect, sending a maintainer to debug correct code.
 */
function assertExpectationIsSelfConsistent(expected: ComputedExpectation): void {
  for (const [i, component] of expected.components.entries()) {
    expect(
      sum(component.bands.map((b) => b.tax)),
      `components[${i}] (${component.kind}): the band tax does not sum to the component's stated tax`,
    ).toBe(component.tax);

    expect(
      sum(component.bands.map((b) => b.amount)),
      `components[${i}] (${component.kind}): the band amounts do not sum to the component's stated amount`,
    ).toBe(component.amount);

    for (const band of component.bands) {
      // floor(amount * rateBp / 10000), the rule in step 6 — floor per band, then sum.
      expect(
        band.tax,
        `components[${i}] (${component.kind}): a band's tax is not floor(amount * effectiveRateBp / 10000)`,
      ).toBe(Number((BigInt(band.amount) * BigInt(band.effectiveRateBp)) / 10_000n));
      expect(
        band.effectiveRateBp,
        `components[${i}] (${component.kind}): a band's effective rate exceeds its own rate — a cap reduces a rate, it never raises one`,
      ).toBeLessThanOrEqual(band.rateBp);
    }
  }

  expect(
    sum(expected.components.map((c) => c.tax)),
    'the components do not sum to the stated gross tax',
  ).toBe(expected.grossTax);

  expect(
    expected.deduction.personalRelief + expected.deduction.qualifyingPayments,
    'deduction.total is not personalRelief + qualifyingPayments — they are one aggregate deduction [IRA s.52(1)]',
  ).toBe(expected.deduction.total);

  expect(
    Math.max(0, expected.partition.reliefEligible - expected.deduction.total),
    'taxableMain is not max(0, reliefEligible - deduction.total)',
  ).toBe(expected.taxableMain);

  expect(
    expected.taxableGain,
    'taxableGain is not the relief-ineligible partition — no deduction applies to a gain [IRA Sch.5 para 2(a), as enacted 2017]',
  ).toBe(expected.partition.reliefIneligible);

  expect(
    expected.credits.apit + expected.credits.ait + expected.credits.foreign,
    'credits.total is not apit + ait + foreign',
  ).toBe(expected.credits.total);

  expect(
    Math.max(0, expected.credits.total - expected.grossTax),
    'credits.excess is not max(0, total - grossTax)',
  ).toBe(expected.credits.excess);

  expect(
    Math.max(0, expected.grossTax - expected.credits.total),
    'taxPayable is not max(0, grossTax - credits.total)',
  ).toBe(expected.taxPayable);

  if (expected.schedule.instalments.length > 0) {
    expect(
      sum(expected.schedule.instalments.map((i) => i.amount)) +
        expected.schedule.finalPayment.amount,
      'the instalments plus the final payment do not sum to the tax payable — no rupee of the liability may be unaccounted for',
    ).toBe(expected.taxPayable);
  }
}

// ---------------------------------------------------------------------------
// Documents that could not be read at all
// ---------------------------------------------------------------------------

describe('worked examples parse', () => {
  it('finds at least one fixture in docs/worked-examples/', () => {
    // Without this, deleting every fixture — or breaking the glob — turns the suite
    // green. An empty run is not a passing run.
    expect(FILES.length).toBeGreaterThan(0);
  });

  if (unparsable.length > 0) {
    for (const { file, error } of unparsable) {
      it(`${file} parses`, () => {
        throw error;
      });
    }
  } else {
    it(`all ${FILES.length} worked example(s) parse as fixtures`, () => {
      expect(unparsable).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// The fixtures themselves — verified and unverified, kept apart
// ---------------------------------------------------------------------------

function defineFixtureTests(fixture: Fixture): void {
  describe(`${fixture.id} (Y/A ${fixture.yearOfAssessment})`, () => {
    let taxYear: TaxYearData;
    let result: TaxResult;

    it('runs against the tax-year data for its own year of assessment', () => {
      taxYear = taxYearFor(fixture);
      expect(taxYear.yearOfAssessment).toBe(fixture.yearOfAssessment);
      result = computeTax(toTaxInput(fixture), taxYear);
    });

    it("the document's own figures are internally consistent", () => {
      const expected = fixture.expected;
      if (expectsRefusal(expected)) {
        expect(
          Math.max(0, expected.partition.reliefEligible - expected.deduction.total),
        ).toBe(expected.taxableMain);
        expect(expected.taxableGain).toBe(expected.partition.reliefIneligible);
        return;
      }
      assertExpectationIsSelfConsistent(expected);
    });

    it('the engine reproduces every field the fixture states', () => {
      const expected = fixture.expected;
      if (expectsRefusal(expected)) {
        assertRefusal(fixture, expected, result);
      } else {
        assertComputed(fixture, expected, result);
      }
    });

    it('does not claim verified: true while applying an unverified rate', () => {
      const appliedUnverified = result.warnings.some(
        (w) => w.code === WARNING_CODES.unverifiedRate,
      );
      if (appliedUnverified) {
        // The engine says a rate it actually applied is marked verified: false in the
        // data. A fixture asserting the resulting figure is asserting a number derived
        // from an unconfirmed — here, known superseded — rate, and must say so.
        expect(
          fixture.verified,
          `${fixture.file} is marked verified: true, but the computation raised an "${WARNING_CODES.unverifiedRate}" warning: ${result.warnings
            .filter((w) => w.code === WARNING_CODES.unverifiedRate)
            .map((w) => w.message)
            .join(' | ')}`,
        ).toBe(false);
      }
    });
  });
}

describe(`verified fixtures (${VERIFIED.length}) — every rate applied is confirmed against a primary source`, () => {
  if (VERIFIED.length === 0) {
    it('none yet', () => {
      expect(VERIFIED).toEqual([]);
    });
  }
  for (const fixture of VERIFIED) defineFixtureTests(fixture);
});

describe(`unverified fixtures (${UNVERIFIED.length}) — figures derived from superseded or unconfirmed rates; a tick here is not a verified answer`, () => {
  if (UNVERIFIED.length === 0) {
    it('none — every fixture currently held depends only on verified rates', () => {
      expect(UNVERIFIED).toEqual([]);
    });
  }
  for (const fixture of UNVERIFIED) defineFixtureTests(fixture);
});

// ---------------------------------------------------------------------------
// The split, stated out loud
// ---------------------------------------------------------------------------

describe('fixture inventory', () => {
  it('accounts for every document in docs/worked-examples/', () => {
    expect(VERIFIED.length + UNVERIFIED.length + unparsable.length).toBe(FILES.length);
  });

  it('every unverified fixture names what is unverified about it', () => {
    for (const fixture of UNVERIFIED) {
      expect(fixture.unverifiedBecause, `${fixture.file}`).toBeTruthy();
    }
  });
});

/**
 * Printed on every run, passing or failing. The suite names above carry the counts too,
 * but a default reporter does not print the name of a suite that passed — and the whole
 * point of the split is that it must not be possible to finish a run without having been
 * told how many of these figures rest on a rate nobody has confirmed.
 */
afterAll(() => {
  const lines: string[] = [
    '',
    '  worked-example fixtures — docs/worked-examples/',
    `  ${'-'.repeat(72)}`,
    `  verified   : ${VERIFIED.length}`,
    `  unverified : ${UNVERIFIED.length}`,
    ...(unparsable.length > 0 ? [`  unparsable : ${unparsable.length}`] : []),
    `  ${'-'.repeat(72)}`,
  ];

  for (const fixture of VERIFIED) {
    lines.push(`  [verified]   ${fixture.id}  (Y/A ${fixture.yearOfAssessment})`);
  }

  for (const fixture of UNVERIFIED) {
    lines.push(`  [UNVERIFIED] ${fixture.id}  (Y/A ${fixture.yearOfAssessment})`);
    lines.push(`                 why: ${fixture.unverifiedBecause ?? '(not stated)'}`);
  }

  for (const { file } of unparsable) {
    lines.push(`  [UNPARSABLE] ${file}`);
  }

  if (UNVERIFIED.length > 0) {
    lines.push(
      `  ${'-'.repeat(72)}`,
      `  ${UNVERIFIED.length} fixture(s) above assert figures derived from rates that have not`,
      '  been confirmed against a primary source in docs/sources/. Those figures are',
      '  not answers, and a passing test beside one does not make them answers.',
    );
  }

  lines.push('');
  console.log(lines.join('\n'));
});

// ---------------------------------------------------------------------------
// The format itself — the harness's own unit tests
// ---------------------------------------------------------------------------

describe('taxYearDataFileName', () => {
  it('maps a year of assessment to its data file', () => {
    expect(taxYearDataFileName('2025/2026')).toBe('2025-26.json');
    expect(taxYearDataFileName('2019/2020')).toBe('2019-20.json');
  });

  it('zero-pads across a century boundary rather than slicing the string', () => {
    // "2099/2100" -> the end year's last two digits are 00, not "10" or "2100".
    expect(taxYearDataFileName('2099/2100')).toBe('2099-00.json');
    expect(taxYearDataFileName('2008/2009')).toBe('2008-09.json');
  });

  it('rejects a pair of years that is not one year of assessment', () => {
    // Would otherwise silently resolve to a real file for a different year.
    expect(() => taxYearDataFileName('2025/2027')).toThrow(/does not name a single year/);
    expect(() => taxYearDataFileName('2026/2025')).toThrow(/does not name a single year/);
  });

  it('rejects a year of assessment written any other way', () => {
    expect(() => taxYearDataFileName('2025-26')).toThrow(/YYYY\/YYYY/);
    expect(() => taxYearDataFileName('2025/26')).toThrow(/YYYY\/YYYY/);
    expect(() => taxYearDataFileName('2025')).toThrow(/YYYY\/YYYY/);
  });
});

describe('front matter parsing', () => {
  const validFrontMatter = [
    '---',
    'id: x-y-2025-26',
    'persona: p2',
    'yearOfAssessment: "2025/2026"',
    'verified: true',
    'input:',
    '  residency: resident',
    '  income:',
    '    employment:',
    '      - label: Salary',
    '        amount: 1740000',
    'expected:',
    '  assessableByHead: { employment: 1740000, business: 0, investment: 0, other: 0 }',
    '  partition: { reliefEligible: 1740000, reliefIneligible: 0 }',
    '  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }',
    '  taxableMain: 0',
    '  taxableGain: 0',
    '  components:',
    '    - { kind: ladder, amount: 0, bands: [], tax: 0 }',
    '  grossTax: 0',
    '  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }',
    '  taxPayable: 0',
    '  schedule:',
    '    instalments: []',
    '    finalPayment: { due: "", amount: 0 }',
    '    returnDue: "2026-11-30"',
    '  warnings: []',
    '---',
    '',
    '# Body',
  ].join('\n');

  it('parses a well-formed document', () => {
    const fixture = parseFixture(validFrontMatter, 'x-y-2025-26.md');
    expect(fixture.id).toBe('x-y-2025-26');
    expect(fixture.input.income.employment?.[0]?.amount).toBe(1_740_000);
  });

  it('reads a block scalar rather than truncating at the first newline', () => {
    // The reason this uses a real YAML parser: a line-based splitter reads the second
    // line of a block scalar as a new key, or as nothing.
    const doc = validFrontMatter.replace(
      'verified: true',
      ['verified: false', 'unverifiedBecause: |', '  first line', '  second line'].join(
        '\n',
      ),
    );
    expect(parseFixture(doc, 'x-y-2025-26.md').unverifiedBecause).toBe(
      'first line\nsecond line\n',
    );
  });

  it('rejects a thousands separator in a money field instead of mis-reading it', () => {
    // YAML 1.2 reads 1_740_000 as the *string* "1_740_000". A parser that coerced it
    // would silently compute on a number the document does not state.
    const doc = validFrontMatter.replace('amount: 1740000', 'amount: 1_740_000');
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/integer rupees/);
  });

  it('rejects a comma-grouped amount, which YAML reads as text', () => {
    const doc = validFrontMatter.replace('amount: 1740000', 'amount: "1,740,000"');
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/integer rupees/);
  });

  it('rejects a float amount', () => {
    const doc = validFrontMatter.replace('amount: 1740000', 'amount: 1740000.50');
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/integer rupees/);
  });

  it('rejects a misspelled expected field rather than silently asserting nothing', () => {
    // The failure this prevents: `taxPaybale` is not compared to anything, the fixture
    // passes forever, and it reads exactly like one that checks the total.
    const doc = validFrontMatter.replace('  taxPayable: 0', '  taxPaybale: 0');
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/taxPayable|Unrecognized/);
  });

  it('requires the expected block to state the schedule and the credits', () => {
    const doc = validFrontMatter.replace(
      '  credits: { apit: 0, ait: 0, foreign: 0, total: 0, excess: 0 }\n',
      '',
    );
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/credits/);
  });

  it('requires the front-matter id to match the filename', () => {
    expect(() => parseFixture(validFrontMatter, 'something-else.md')).toThrow(
      /filename says/,
    );
  });

  it('requires a verified: false fixture to say what is unverified', () => {
    const doc = validFrontMatter.replace('verified: true', 'verified: false');
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/unverifiedBecause/);
  });

  it('rejects creditsPaid.foreign, naming the field to use instead', () => {
    // s.81(1) caps the foreign tax credit per source, so it cannot be one aggregate.
    const doc = validFrontMatter.replace(
      'input:\n',
      'input:\n  creditsPaid: { apit: 0, foreign: 1000 }\n',
    );
    expect(() => parseFixture(doc, 'x-y-2025-26.md')).toThrow(/Unrecognized key/);
  });

  it('rejects a document with no front matter', () => {
    expect(() => parseFrontMatter('# Just prose\n', 'x.md')).toThrow(/front matter/);
  });

  it('does not treat README.md as a fixture', () => {
    // Its illustrative example is a fenced block that begins with `---`.
    expect(listFixtureFiles(WORKED_EXAMPLES_DIR)).not.toContain('README.md');
  });
});

describe('refusal fixtures', () => {
  const refusalFrontMatter = [
    '---',
    'id: r-2025-26',
    'yearOfAssessment: "2025/2026"',
    'verified: true',
    'input:',
    '  residency: resident',
    '  income:',
    '    business:',
    '      - label: Consultancy',
    '        amount: 5000000',
    '        tags: [foreign-capped]',
    '        conditions: { remitted-through-bank-to-sri-lanka: true }',
    '      - label: Local work',
    '        amount: 2000000',
    'expected:',
    '  refusal: { code: mixed-capped-and-uncapped-ordering, question: Q14 }',
    '  assessableByHead: { employment: 0, business: 7000000, investment: 0, other: 0 }',
    '  partition: { reliefEligible: 7000000, reliefIneligible: 0 }',
    '  deduction: { personalRelief: 1800000, qualifyingPayments: 0, total: 1800000 }',
    '  taxableMain: 5200000',
    '  taxableGain: 0',
    '  warnings: []',
    '---',
    '',
    '# Body',
  ].join('\n');

  it('accepts a refusal fixture that states no figure', () => {
    const fixture = parseFixture(refusalFrontMatter, 'r-2025-26.md');
    expect(expectsRefusal(fixture.expected)).toBe(true);
  });

  it('rejects a refusal fixture that also states a figure', () => {
    // The prompt is explicit: the mixed-capped example asserts a refusal, not a number.
    // On a refusal, taxPayable is a zeroed placeholder — asserting it equals 0 would
    // record "no answer was produced" as "no tax is due".
    const doc = refusalFrontMatter.replace(
      '  taxableGain: 0',
      '  taxableGain: 0\n  taxPayable: 0',
    );
    expect(() => parseFixture(doc, 'r-2025-26.md')).toThrow(/no figure was produced/);
  });

  it('is what the engine actually does for mixed capped and uncapped income', () => {
    // Not a document in docs/worked-examples/ yet — that fact pattern belongs to a
    // persona-grounded example still to be written. This proves the *format* round-trips
    // against the real engine, so the example can be written against it with confidence.
    const fixture = parseFixture(refusalFrontMatter, 'r-2025-26.md');
    const result = computeTax(toTaxInput(fixture), taxYearFor(fixture));
    const expected = fixture.expected;
    expect(expectsRefusal(expected)).toBe(true);
    if (!expectsRefusal(expected)) return;
    assertRefusal(fixture, expected, result);
  });
});

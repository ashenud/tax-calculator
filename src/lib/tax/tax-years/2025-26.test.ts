import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { taxYearFileSchema } from '../schema';

/**
 * Transcription check for `data/tax-years/2025-26.json`.
 *
 * This suite is not a schema test — `schema.test.ts` owns that. It asserts that the
 * *values actually shipped* for Y/A 2025/2026 are the ones transcribed in
 * `docs/research/04-rate-tables.md`, which are in turn cited to
 * [Act 2/2025 s.3, First Schedule para 1(1D)] and [PN/IT/2025-01, para 1].
 *
 * The expected figures below are written out as literals on purpose. Deriving them
 * from the data file would make the test tautological: it would pass whatever the
 * file happened to say. A rate band edited by hand must break a test that spells the
 * band out, or the test proves nothing.
 */

const DATA_FILE = fileURLToPath(
  new URL('../../../../data/tax-years/2025-26.json', import.meta.url),
);

const raw: unknown = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));

/**
 * Parsing here is itself an acceptance check: `taxYearFileSchema`'s `superRefine`
 * walks every `src` in the file and fails if any does not resolve to a key in the
 * file's own `sources` map. A successful parse therefore proves src resolution — the
 * explicit assertion further down restates it so a reader does not have to know that.
 */
const parsed = taxYearFileSchema.parse(raw);

/**
 * Record lookups are `T | undefined` under `noUncheckedIndexedAccess`. A missing key
 * is a real failure of this file, not a type nuisance, so it throws by name rather
 * than being silenced with `!`.
 */
function must<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`2025-26.json is missing ${name}`);
  return value;
}

describe('data/tax-years/2025-26.json', () => {
  it('parses against taxYearFileSchema', () => {
    expect(taxYearFileSchema.safeParse(raw).success).toBe(true);
  });

  it('is the enacted Y/A 2025/2026 file, 1 Apr 2025 to 31 Mar 2026', () => {
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.yearOfAssessment).toBe('2025/2026');
    expect(parsed.period).toEqual({ from: '2025-04-01', to: '2026-03-31' });
    // Act 2/2025 came into operation on 1 April 2025 [Act 2/2025 s.1(2)].
    expect(parsed.status).toBe('enacted');
  });

  // [PN/IT/2025-01, para 1]; [IRA Sch.5 para 2(a)(v), ins. Act 2/2025 s.5(3)]
  it('carries personal relief of Rs. 1,800,000 for residents and non-resident citizens', () => {
    const personal = must(parsed.reliefs.personal, 'reliefs.personal');
    expect(personal.amount).toBe(1800000);
    expect(personal.appliesTo).toEqual(['resident', 'non-resident-citizen']);
  });

  // [Act 2/2025 s.3, First Schedule para 1(1D)] — widths as the statute states them,
  // not cumulative thresholds. See docs/research/04-rate-tables.md.
  it('carries the five-band normal ladder exactly as transcribed in 04-rate-tables.md', () => {
    const bands = must(
      parsed.rateSchedules['individual-normal'],
      "rateSchedules['individual-normal']",
    ).bands;

    expect(bands.map((b) => b.rateBp)).toEqual([600, 1800, 2400, 3000, 3600]);
    expect(bands.map((b) => b.width)).toEqual([1000000, 500000, 500000, 500000, null]);
  });

  it('has no 12% band — removed from 1 April 2025 [Act 2/2025 s.3] (Q3)', () => {
    const bands = must(
      parsed.rateSchedules['individual-normal'],
      "rateSchedules['individual-normal']",
    ).bands;
    expect(bands.map((b) => b.rateBp)).not.toContain(1200);
  });

  // The 15% is a maximum rate on a component of the ladder, not a schedule of its own
  // [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. Modelling it as a second rate
  // schedule is the specific error docs/spec/data-model.md records as corrected.
  it('models the 15% service-export / foreign-source treatment as a cap, not a schedule', () => {
    expect(Object.keys(parsed.rateSchedules)).toEqual(['individual-normal']);

    const cap = must(
      parsed.rateCaps['service-export-foreign'],
      "rateCaps['service-export-foreign']",
    );
    expect(cap.maxRateBp).toBe(1500);
    expect(cap.appliesToSchedule).toBe('individual-normal');
    expect(cap.conditions).toEqual(['remitted-through-bank-to-sri-lanka']);
    // An unmet condition means the cap does not apply and the normal ladder stands.
    expect(
      must(
        parsed.conditions['remitted-through-bank-to-sri-lanka'],
        "conditions['remitted-through-bank-to-sri-lanka']",
      ).ifNotMet,
    ).toBeNull();
  });

  it('carries the 45% special-business rate and the 10% rate on interest', () => {
    const specialBusiness = must(
      parsed.separatelyRated['special-business'],
      "separatelyRated['special-business']",
    );
    expect(specialBusiness).toHaveProperty('rateBp', 4500); // [Act 2/2025 s.3(1)(c)]
    expect(must(parsed.wht.interest, 'wht.interest').rateBp).toBe(1000); // [Act 2/2025 s.3(3)]
  });

  /**
   * Both components are 2017 text. Capital gains is *known* superseded by Act No. 11
   * of 2026, which this repo does not hold (Q42); the terminal benefit tables' currency
   * for Y/A 2025/26 is unestablished (Q32). The engine warns on any unverified rate it
   * actually applies, so flipping either flag to silence a warning is the failure this
   * assertion exists to catch.
   */
  it('marks capital gains and terminal benefits unverified', () => {
    expect(
      must(parsed.separatelyRated['capital-gain'], "separatelyRated['capital-gain']")
        .verified,
    ).toBe(false);
    expect(
      must(
        parsed.separatelyRated['terminal-benefit'],
        "separatelyRated['terminal-benefit']",
      ).verified,
    ).toBe(false);
  });

  it('leaves qualifying payments and APIT tables empty — neither is established', () => {
    expect(parsed.qualifyingPayments).toEqual([]);
    expect(parsed.apit.tables).toEqual([]);
  });

  it('stores the return due date as a rule, not a literal date [IRA s.93(1)]', () => {
    expect(parsed.calendar.returnDueRule.monthsAfterYearEnd).toBe(8);
    expect(JSON.stringify(parsed.calendar.returnDueRule)).not.toMatch(
      /\d{4}-\d{2}-\d{2}/,
    );
  });

  it('carries the four instalment dates [IRA s.90(2)(a)]', () => {
    expect(parsed.calendar.instalments.map((i) => i.due)).toEqual([
      '2025-08-15',
      '2025-11-15',
      '2026-02-15',
      '2026-05-15',
    ]);
  });

  /**
   * Restates, explicitly, what the successful parse above already proved: every `src`
   * anywhere in the file names a key present in the file's own `sources` map. Walked
   * here over the raw JSON so the assertion does not depend on the schema's own
   * traversal being correct.
   */
  it("resolves every src to a key in the file's own sources map", () => {
    const sourceKeys = new Set(Object.keys(parsed.sources));
    const found: string[] = [];

    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node !== null && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === 'src' && typeof value === 'string') found.push(value);
          walk(value);
        }
      }
    };
    walk(raw);

    // A file with no src pointers at all would pass an "every src resolves" check
    // vacuously; assert there are some before asserting they resolve.
    expect(found.length).toBeGreaterThan(20);

    const unresolved = found.filter((src) => !sourceKeys.has(src.split('#')[0] ?? src));
    expect(unresolved).toEqual([]);
  });
});

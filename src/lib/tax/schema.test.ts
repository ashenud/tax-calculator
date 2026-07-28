import { describe, expect, it } from 'vitest';
import { taxYearFileSchema } from './schema';

/**
 * A minimal, structurally valid tax-year file. Every test below takes a deep clone
 * of this and mutates exactly the thing it wants to break, so a failing test proves
 * one rule and one rule only.
 *
 * The figures here are placeholders for schema-shape testing only — they are not
 * real, are not cited to anything checkable, and must never be treated as tax data.
 * P03 owns the real 2025/26 file.
 */
function validBaseFile(): unknown {
  return {
    schemaVersion: 1,
    yearOfAssessment: '2025/2026',
    period: { from: '2025-04-01', to: '2026-03-31' },
    status: 'enacted',
    lastReviewed: '2026-07-27',

    sources: {
      'ira-2017': {
        title: 'Inland Revenue Act, No. 24 of 2017',
        file: 'docs/sources/ir-act-24-2017.pdf',
      },
      'act-2-2025': {
        title: 'Inland Revenue (Amendment) Act, No. 2 of 2025',
        file: 'docs/sources/ir-amendment-act-2-2025.pdf',
      },
    },

    reliefs: {
      personal: { amount: 1800000, appliesTo: ['resident'], src: 'act-2-2025#s.14' },
    },
    qualifyingPayments: [],

    rateSchedules: {
      'individual-normal': {
        label: 'Resident individual — normal rates',
        verified: true,
        bands: [
          { width: 1000000, rateBp: 600, src: 'act-2-2025#s.3(1)(b)' },
          { width: 500000, rateBp: 1800, src: 'act-2-2025#s.3(1)(b)' },
          { width: null, rateBp: 3600, src: 'act-2-2025#s.3(1)(b)' },
        ],
      },
    },

    rateCaps: {
      'service-export-foreign': {
        label: 'Service export / foreign source gains and profits — maximum rate',
        appliesToSchedule: 'individual-normal',
        maxRateBp: 1500,
        conditions: ['remitted-through-bank-to-sri-lanka'],
        verified: true,
        src: 'act-2-2025#s.3(1)(d)',
      },
    },

    conditions: {
      'remitted-through-bank-to-sri-lanka': {
        question: 'Were these earnings remitted through a bank to Sri Lanka?',
        ifNotMet: null,
        evidence: 'Bank inward remittance advice',
        src: 'act-2-2025#s.3(1)(d)',
      },
    },

    separatelyRated: {
      'capital-gain': {
        label: 'Gains on realisation of investment assets',
        rateBp: 1000,
        reliefEligible: false,
        verified: false,
        src: 'ira-2017#sch.1-para-1(2)(a)',
      },
      'terminal-benefit': {
        label: 'Terminal benefits',
        selector: { field: 'serviceYears', thresholdYears: 20 },
        tablesBySelector: {
          atOrBelow: [
            { width: 2000000, rateBp: 0, src: 'ira-2017#sch.1-para-1(2)(b)(i)' },
            { width: null, rateBp: 1000, src: 'ira-2017#sch.1-para-1(2)(b)(i)' },
          ],
          above: [
            { width: 5000000, rateBp: 0, src: 'ira-2017#sch.1-para-1(2)(b)(ii)' },
            { width: null, rateBp: 1000, src: 'ira-2017#sch.1-para-1(2)(b)(ii)' },
          ],
        },
        reliefEligible: false,
        verified: false,
        src: 'ira-2017#sch.1-para-1(2)(b)',
      },
    },

    apit: { tables: [], src: 'ira-2017#s.114' },
    wht: {
      interest: { rateBp: 1000, verified: true, src: 'act-2-2025#s.3(3)' },
    },

    calendar: {
      instalments: [
        { quarter: 1, due: '2025-08-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 2, due: '2025-11-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 3, due: '2026-02-15', src: 'ira-2017#s.90(2)(a)' },
        { quarter: 4, due: '2026-05-15', src: 'ira-2017#s.90(2)(a)' },
      ],
      returnDueRule: { monthsAfterYearEnd: 8, src: 'ira-2017#s.93(1)' },
    },
  };
}

/** Deep clone via structuredClone so mutating a test fixture never leaks into another test. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

describe('taxYearFileSchema — valid data', () => {
  it('accepts the base fixture unmodified', () => {
    const result = taxYearFileSchema.safeParse(validBaseFile());
    expect(result.success).toBe(true);
  });
});

describe('taxYearFileSchema — rejections', () => {
  it('rejects a leaf value missing src', () => {
    const file = clone(validBaseFile()) as any;
    delete file.reliefs.personal.src;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a src that does not resolve to a key in sources (dangling src)', () => {
    const file = clone(validBaseFile()) as any;
    file.reliefs.personal.src = 'nonexistent-act#s.1';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('does not resolve')),
      ).toBe(true);
    }
  });

  it('rejects a float rate', () => {
    const file = clone(validBaseFile()) as any;
    file.rateSchedules['individual-normal'].bands[0].rateBp = 6.5;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a float amount', () => {
    const file = clone(validBaseFile()) as any;
    file.reliefs.personal.amount = 1800000.5;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a rate outside 0-10000 basis points', () => {
    const file = clone(validBaseFile()) as any;
    file.rateSchedules['individual-normal'].bands[0].rateBp = 10001;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a negative amount', () => {
    const file = clone(validBaseFile()) as any;
    file.reliefs.personal.amount = -1;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a band array with two width: null bands', () => {
    const file = clone(validBaseFile()) as any;
    file.rateSchedules['individual-normal'].bands.push({
      width: null,
      rateBp: 4000,
      src: 'act-2-2025#s.3(1)(b)',
    });

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('exactly one band')),
      ).toBe(true);
    }
  });

  it('rejects a band array with zero width: null bands', () => {
    const file = clone(validBaseFile()) as any;
    file.rateSchedules['individual-normal'].bands = file.rateSchedules[
      'individual-normal'
    ].bands.filter((b: { width: number | null }) => b.width !== null);

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('exactly one band')),
      ).toBe(true);
    }
  });

  it('rejects a width: null band that is not last', () => {
    const file = clone(validBaseFile()) as any;
    const bands = file.rateSchedules['individual-normal'].bands;
    const [terminal] = bands.splice(bands.length - 1, 1);
    bands.unshift(terminal);

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('must be the last band')),
      ).toBe(true);
    }
  });

  it('rejects rateCaps[].appliesToSchedule pointing at a non-existent schedule', () => {
    const file = clone(validBaseFile()) as any;
    file.rateCaps['service-export-foreign'].appliesToSchedule = 'no-such-schedule';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('is not a schedule in rateSchedules'),
        ),
      ).toBe(true);
    }
  });

  it('rejects conditions[].ifNotMet pointing at a non-existent schedule', () => {
    const file = clone(validBaseFile()) as any;
    file.conditions['remitted-through-bank-to-sri-lanka'].ifNotMet = 'no-such-schedule';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('is not a schedule in rateSchedules, and is not null'),
        ),
      ).toBe(true);
    }
  });

  it('accepts conditions[].ifNotMet as null (cap simply does not apply)', () => {
    const file = clone(validBaseFile()) as any;
    file.conditions['remitted-through-bank-to-sri-lanka'].ifNotMet = null;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('rejects a period that does not start on 1 April', () => {
    const file = clone(validBaseFile()) as any;
    file.period.from = '2025-04-02';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('must be 1 April'))).toBe(
        true,
      );
    }
  });

  it('rejects a period that does not end on 31 March', () => {
    const file = clone(validBaseFile()) as any;
    file.period.to = '2026-04-01';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('must be 31 March')),
      ).toBe(true);
    }
  });

  it('rejects a period that does not span exactly twelve months', () => {
    const file = clone(validBaseFile()) as any;
    file.yearOfAssessment = '2025/2027';
    file.period.to = '2027-03-31';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('must span exactly one year')),
      ).toBe(true);
    }
  });

  it('rejects a rateCaps maxRateBp at or above the schedule top rate (caps nothing)', () => {
    const file = clone(validBaseFile()) as any;
    file.rateCaps['service-export-foreign'].maxRateBp = 3600;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('would never actually reduce'),
        ),
      ).toBe(true);
    }
  });

  it('rejects rateCaps[].conditions naming a condition that does not exist', () => {
    const file = clone(validBaseFile()) as any;
    file.rateCaps['service-export-foreign'].conditions = ['no-such-condition'];

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('which is not in conditions')),
      ).toBe(true);
    }
  });

  it('rejects capital-gain with reliefEligible: true (Fifth Schedule para 2(a))', () => {
    const file = clone(validBaseFile()) as any;
    file.separatelyRated['capital-gain'].reliefEligible = true;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('relief cannot be deducted against gains'),
        ),
      ).toBe(true);
    }
  });

  it('rejects an instalment due date far outside the period', () => {
    const file = clone(validBaseFile()) as any;
    file.calendar.instalments[0].due = '2024-01-01';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a status outside proposed | enacted | superseded', () => {
    const file = clone(validBaseFile()) as any;
    file.status = 'draft';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown top-level key (typo guard, e.g. "scr" for "src")', () => {
    const file = clone(validBaseFile()) as any;
    file.reliefs.personal.scr = file.reliefs.personal.src;
    delete file.reliefs.personal.src;

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });

  it('rejects a yearOfAssessment inconsistent with period', () => {
    const file = clone(validBaseFile()) as any;
    file.yearOfAssessment = '2024/2025';

    const result = taxYearFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('does not match period')),
      ).toBe(true);
    }
  });
});

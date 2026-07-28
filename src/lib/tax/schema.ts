/**
 * Zod schema for a tax-year data file (`data/tax-years/<YYYY-YY>.json`).
 *
 * This is the single source of truth for the shape of tax data in this repo — see
 * `docs/spec/data-model.md` (authoritative) and `docs/decisions/adr-0002-tax-data-as-versioned-json.md`.
 *
 * Two properties are non-negotiable and are enforced here, not left to convention:
 *
 *   1. Every leaf value object carries a `src` pointer, and every `src` resolves to a
 *      key in that file's own `sources` map. There is no escape hatch.
 *   2. Money is integer rupees; rates are integer basis points, 0-10000. Zod's `.int()`
 *      rejects any float, so this is a parse-time guarantee, not a lint.
 *
 * `data/schema/tax-year.schema.json` is generated from this file via
 * `z.toJSONSchema()` (zod v4 native — see `scripts/generate-json-schema.mjs`) so the
 * data files remain editable, with editor validation, by someone who does not read
 * TypeScript.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** YYYY-MM-DD. Deliberately a plain string, not a Date — dates are compared as
 * calendar dates, never through a timezone-sensitive `Date` object. */
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected an ISO date in YYYY-MM-DD form');

/** A pointer into this file's own `sources` map, e.g. `"act-2-2025#s.3(1)(b)"`.
 * The part after `#` is a human-readable pinpoint and is not itself validated here —
 * only the part before `#` (or the whole string, if there is no `#`) is checked
 * against `sources` keys, in the top-level cross-reference check below. */
const srcRef = z.string().min(1, 'src must not be empty');

/** Every leaf value in this file that states a rate is basis points: integer, 0-10000.
 * 6% is 600, 15% is 1500. Never a decimal — `.int()` rejects 0.06 outright. */
const basisPoints = z
  .number()
  .int('rate must be an integer number of basis points, never a float')
  .min(0)
  .max(10000);

/** Every leaf value in this file that states a rupee amount is a non-negative integer. */
const rupees = z
  .number()
  .int('amounts must be integer rupees, never a float')
  .nonnegative();

const statusEnum = z.enum(['proposed', 'enacted', 'superseded']);

function parseIsoDate(s: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) {
    // Unreachable in practice: isoDateString already enforced the pattern before
    // any code path reaches here.
    throw new Error(`not an ISO date: ${s}`);
  }
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------

const sourceEntry = z
  .object({
    title: z.string().min(1),
    file: z.string().min(1),
  })
  .strict();

const sourcesRecord = z.record(z.string().min(1), sourceEntry);

// ---------------------------------------------------------------------------
// reliefs / qualifying payments
// ---------------------------------------------------------------------------

const relief = z
  .object({
    amount: rupees,
    appliesTo: z.array(z.string().min(1)).min(1),
    src: srcRef,
  })
  .strict();

const reliefsRecord = z.record(z.string().min(1), relief);

const qualifyingPayment = z
  .object({
    id: z.string().min(1),
    cap: rupees,
    rate: basisPoints,
    src: srcRef,
  })
  .strict();

// ---------------------------------------------------------------------------
// band arrays — the normal ladder, and the tables inside separately-rated components
// ---------------------------------------------------------------------------

/** A band's width is what the statute states ("the next Rs. 500,000"); cumulative
 * thresholds are derived at load time, never transcribed by hand. `width: null` marks
 * the final, unbounded band — "the balance". */
const band = z
  .object({
    width: z.union([rupees, z.null()]),
    rateBp: basisPoints,
    src: srcRef,
  })
  .strict();

const bandArray = z
  .array(band)
  .min(1, 'a band table must have at least one band')
  .superRefine((bands, ctx) => {
    const nullIndexes = bands.reduce<number[]>((acc, b, i) => {
      if (b.width === null) acc.push(i);
      return acc;
    }, []);

    if (nullIndexes.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message:
          'exactly one band must have width: null (the terminal, unbounded band) — none found',
      });
      return;
    }

    if (nullIndexes.length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: `exactly one band must have width: null — found ${nullIndexes.length}, at indexes ${nullIndexes.join(', ')}`,
      });
      return;
    }

    const [onlyNullIndex] = nullIndexes;
    if (onlyNullIndex !== bands.length - 1) {
      ctx.addIssue({
        code: 'custom',
        message: `the width: null band must be the last band in the table (found at index ${onlyNullIndex} of ${bands.length - 1})`,
      });
    }
  });

// ---------------------------------------------------------------------------
// rate schedules — the normal ladder(s)
// ---------------------------------------------------------------------------

/** `verified` is required, not defaulted: every rate/table object in this file is a
 * "top-level verified: boolean" object per the build prompt, and the engine warns on
 * any unverified rate it actually applies. Requiring the field (no default) forces
 * whoever adds data to state the position explicitly rather than let it default to
 * an unearned "true". */
const rateSchedule = z
  .object({
    label: z.string().min(1),
    bands: bandArray,
    verified: z.boolean(),
  })
  .strict();

const rateSchedulesRecord = z.record(z.string().min(1), rateSchedule);

// ---------------------------------------------------------------------------
// conditions
// ---------------------------------------------------------------------------

const condition = z
  .object({
    question: z.string().min(1),
    // null means "the cap this condition gates simply does not apply; the normal
    // ladder stands unmodified" — never a fallback schedule that doesn't exist.
    ifNotMet: z.union([z.string().min(1), z.null()]),
    evidence: z.string().min(1),
    src: srcRef,
  })
  .strict();

const conditionsRecord = z.record(z.string().min(1), condition);

// ---------------------------------------------------------------------------
// rate caps — the 15% maximum-rate treatment, a cap on a named schedule
// ---------------------------------------------------------------------------

const rateCap = z
  .object({
    label: z.string().min(1),
    appliesToSchedule: z.string().min(1),
    maxRateBp: basisPoints,
    conditions: z.array(z.string().min(1)).default([]),
    verified: z.boolean(),
    src: srcRef,
  })
  .strict();

const rateCapsRecord = z.record(z.string().min(1), rateCap);

// ---------------------------------------------------------------------------
// separately-rated components — capital gain, terminal benefit, special business
// ---------------------------------------------------------------------------

const separatelyRatedFlat = z
  .object({
    label: z.string().min(1),
    rateBp: basisPoints,
    // Capital gain must be `false` per Fifth Schedule para 2(a): relief cannot be
    // deducted against gains from realisation. That specific value is asserted in the
    // cross-field check below, not hardcoded here, since this shape is shared by every
    // flat-rate separately-rated component.
    reliefEligible: z.boolean(),
    verified: z.boolean(),
    src: srcRef,
  })
  .strict();

const selector = z
  .object({
    field: z.string().min(1),
    thresholdYears: z.number().int().nonnegative(),
  })
  .strict();

const selectorTables = z
  .object({
    atOrBelow: bandArray,
    above: bandArray,
  })
  .strict();

const separatelyRatedSelectorTable = z
  .object({
    label: z.string().min(1),
    selector,
    tablesBySelector: selectorTables,
    reliefEligible: z.boolean(),
    verified: z.boolean(),
    src: srcRef,
  })
  .strict();

const separatelyRatedComponent = z.union([
  separatelyRatedFlat,
  separatelyRatedSelectorTable,
]);

const separatelyRatedRecord = z.record(z.string().min(1), separatelyRatedComponent);

// ---------------------------------------------------------------------------
// APIT / WHT
// ---------------------------------------------------------------------------

/** APIT table structure is not yet detailed anywhere in docs/spec — see the report
 * for this prompt. Modelled defensively on the same (label + bands) shape as a rate
 * schedule, since that is the only banded-table shape this spec defines, rather than
 * left as an untyped escape hatch. */
const apitTable = z
  .object({
    label: z.string().min(1),
    bands: bandArray,
    verified: z.boolean(),
  })
  .strict();

const apit = z
  .object({
    tables: z.array(apitTable).default([]),
    src: srcRef,
  })
  .strict();

const whtEntry = z
  .object({
    rateBp: basisPoints,
    verified: z.boolean(),
    src: srcRef,
  })
  .strict();

const whtRecord = z.record(z.string().min(1), whtEntry);

// ---------------------------------------------------------------------------
// calendar
// ---------------------------------------------------------------------------

const instalment = z
  .object({
    quarter: z.number().int().min(1).max(4),
    due: isoDateString,
    src: srcRef,
  })
  .strict();

const returnDueRule = z
  .object({
    // A rule, not a stored literal date — IRA s.93(1): "eight months after the end of
    // the year of assessment". A new year needs no new entry here.
    monthsAfterYearEnd: z.number().int().positive(),
    src: srcRef,
  })
  .strict();

const calendar = z
  .object({
    instalments: z.array(instalment).min(1),
    returnDueRule,
  })
  .strict();

// ---------------------------------------------------------------------------
// period
// ---------------------------------------------------------------------------

const period = z
  .object({
    from: isoDateString,
    to: isoDateString,
  })
  .strict()
  .superRefine((p, ctx) => {
    const from = parseIsoDate(p.from);
    const to = parseIsoDate(p.to);

    if (from.m !== 4 || from.d !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['from'],
        message: `period.from must be 1 April (year of assessment starts 1 Apr) — got ${p.from}`,
      });
    }

    if (to.m !== 3 || to.d !== 31) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: `period.to must be 31 March (year of assessment ends 31 Mar) — got ${p.to}`,
      });
    }

    if (to.y - from.y !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: `period must span exactly one year, 1 April to 31 March the following year — got ${p.from} to ${p.to}`,
      });
    }
  });

// ---------------------------------------------------------------------------
// top-level tax-year file
// ---------------------------------------------------------------------------

const taxYearFileShape = z
  .object({
    schemaVersion: z.literal(1),

    yearOfAssessment: z
      .string()
      .regex(/^\d{4}\/\d{4}$/, 'expected "YYYY/YYYY", e.g. "2025/2026"'),
    period,
    status: statusEnum,
    lastReviewed: isoDateString,

    sources: sourcesRecord,

    reliefs: reliefsRecord,
    qualifyingPayments: z.array(qualifyingPayment).default([]),

    rateSchedules: rateSchedulesRecord,
    rateCaps: rateCapsRecord.default({}),
    conditions: conditionsRecord.default({}),
    separatelyRated: separatelyRatedRecord.default({}),

    apit,
    wht: whtRecord,

    calendar,
  })
  .strict();

/** Recursively walk a parsed value looking for `{ src: string }` occurrences,
 * regardless of which container they sit in. This is what lets "every src resolves to
 * a key in sources" be checked once, generically, instead of being re-implemented at
 * every nesting level that happens to hold a `src` field. */
function collectSrcRefs(
  node: unknown,
  path: (string | number)[],
  out: { path: (string | number)[]; src: string }[],
): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectSrcRefs(item, [...path, i], out));
    return;
  }

  if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'src' && typeof value === 'string') {
        out.push({ path: [...path, key], src: value });
      }
      collectSrcRefs(value, [...path, key], out);
    }
  }
}

/** A `src` may carry a pinpoint after `#` (e.g. `"act-2-2025#s.3(1)(b)"`). Only the
 * part before `#` names a `sources` key. */
function sourceKeyOf(src: string): string {
  const hashIndex = src.indexOf('#');
  return hashIndex === -1 ? src : src.slice(0, hashIndex);
}

export const taxYearFileSchema = taxYearFileShape.superRefine((file, ctx) => {
  // -- every src resolves to a key in this file's own sources map --
  const sourceKeys = new Set(Object.keys(file.sources));
  const allSrcRefs: { path: (string | number)[]; src: string }[] = [];
  collectSrcRefs(file, [], allSrcRefs);

  for (const { path, src } of allSrcRefs) {
    const key = sourceKeyOf(src);
    if (!sourceKeys.has(key)) {
      ctx.addIssue({
        code: 'custom',
        path,
        message: `src "${src}" does not resolve to any key in sources (looked for "${key}")`,
      });
    }
  }

  // -- yearOfAssessment is consistent with period --
  const [yFrom, yTo] = file.yearOfAssessment.split('/').map(Number);
  const periodFrom = parseIsoDate(file.period.from);
  const periodTo = parseIsoDate(file.period.to);
  if (yFrom !== periodFrom.y || yTo !== periodTo.y) {
    ctx.addIssue({
      code: 'custom',
      path: ['yearOfAssessment'],
      message: `yearOfAssessment "${file.yearOfAssessment}" does not match period ${file.period.from}..${file.period.to}`,
    });
  }

  // -- every rateCaps[].appliesToSchedule names a schedule that exists --
  const scheduleIds = new Set(Object.keys(file.rateSchedules));
  for (const [capId, cap] of Object.entries(file.rateCaps)) {
    if (!scheduleIds.has(cap.appliesToSchedule)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rateCaps', capId, 'appliesToSchedule'],
        message: `rateCaps.${capId}.appliesToSchedule "${cap.appliesToSchedule}" is not a schedule in rateSchedules`,
      });
    }

    // Schema-level sanity, not engine logic: a cap that is at or above the schedule's
    // own top marginal rate caps nothing, and is almost certainly a data-entry error
    // (wrong schedule referenced, or maxRateBp transcribed wrongly).
    const schedule = file.rateSchedules[cap.appliesToSchedule];
    if (schedule) {
      const topRateBp = Math.max(...schedule.bands.map((b) => b.rateBp));
      if (cap.maxRateBp >= topRateBp) {
        ctx.addIssue({
          code: 'custom',
          path: ['rateCaps', capId, 'maxRateBp'],
          message: `rateCaps.${capId}.maxRateBp (${cap.maxRateBp}) is not below the top marginal rate (${topRateBp}) of "${cap.appliesToSchedule}" — this cap would never actually reduce anything`,
        });
      }
    }

    for (const conditionId of cap.conditions) {
      if (!(conditionId in file.conditions)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rateCaps', capId, 'conditions'],
          message: `rateCaps.${capId} names condition "${conditionId}", which is not in conditions`,
        });
      }
    }
  }

  // -- every conditions[].ifNotMet is null or an existing schedule id --
  for (const [conditionId, cond] of Object.entries(file.conditions)) {
    if (cond.ifNotMet !== null && !scheduleIds.has(cond.ifNotMet)) {
      ctx.addIssue({
        code: 'custom',
        path: ['conditions', conditionId, 'ifNotMet'],
        message: `conditions.${conditionId}.ifNotMet "${cond.ifNotMet}" is not a schedule in rateSchedules, and is not null`,
      });
    }
  }

  // -- capital gain is never relief-eligible: Fifth Schedule para 2(a) --
  const capitalGain = file.separatelyRated['capital-gain'];
  if (capitalGain && capitalGain.reliefEligible !== false) {
    ctx.addIssue({
      code: 'custom',
      path: ['separatelyRated', 'capital-gain', 'reliefEligible'],
      message:
        'separatelyRated["capital-gain"].reliefEligible must be false — relief cannot be deducted against gains from realisation [Fifth Schedule para 2(a)]',
    });
  }

  // -- instalment due dates fall within, or shortly after, period --
  // "Shortly after" is read generously (up to 90 days past period.to) to cover the
  // final instalment, which statute places after the year of assessment ends
  // (e.g. Q4 2025/26 falls due 2026-05-15, 45 days after period.to).
  const periodFromDate = Date.UTC(periodFrom.y, periodFrom.m - 1, periodFrom.d);
  const periodToDate = Date.UTC(periodTo.y, periodTo.m - 1, periodTo.d);
  const graceMs = 90 * 24 * 60 * 60 * 1000;

  file.calendar.instalments.forEach((inst, i) => {
    const due = parseIsoDate(inst.due);
    const dueDate = Date.UTC(due.y, due.m - 1, due.d);
    if (dueDate < periodFromDate || dueDate > periodToDate + graceMs) {
      ctx.addIssue({
        code: 'custom',
        path: ['calendar', 'instalments', i, 'due'],
        message: `instalment due date ${inst.due} does not fall within period ${file.period.from}..${file.period.to}, or shortly (within 90 days) after it`,
      });
    }
  });
});

export type TaxYearFile = z.infer<typeof taxYearFileSchema>;
export type Band = z.infer<typeof band>;
export type RateSchedule = z.infer<typeof rateSchedule>;
export type RateCap = z.infer<typeof rateCap>;
export type Condition = z.infer<typeof condition>;
export type SeparatelyRatedComponent = z.infer<typeof separatelyRatedComponent>;
export type Relief = z.infer<typeof relief>;
export type QualifyingPayment = z.infer<typeof qualifyingPayment>;
export type Instalment = z.infer<typeof instalment>;
export type SourceEntry = z.infer<typeof sourceEntry>;

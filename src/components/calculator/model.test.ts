/**
 * The mapping from what a person answered onto what the engine is charged with.
 *
 * No DOM here, deliberately. This is the layer where a mistake is expensive and
 * invisible — an amount landing in the wrong head, a tag dropped, a condition
 * answer attached to the wrong source — and none of that needs a browser to
 * check. The rendering is covered separately in `TaxCalculator.test.tsx`.
 */

import { describe, expect, it } from 'vitest';
import {
  INITIAL_STATE,
  MONEY_FIELDS,
  RESIDENCY_OPTIONS,
  SECTION_IDS,
  buildTaxInput,
  cappedIncomeFields,
  conditionsForCappedIncome,
  isRealIsoDate,
  moneyFieldsFor,
  parseServiceYears,
  resolveLadderId,
  sectionsFor,
  visibleSections,
  type CalculatorState,
  type MoneyFieldId,
} from './model.ts';
import { computeTax, isRefusal } from '../../lib/tax/engine.ts';
import { loadTaxYears } from '../../lib/tax/load.ts';
import { taxYearFileSchema, type TaxYearFile } from '../../lib/tax/schema.ts';

const taxYear = loadTaxYears()[0]!.data;

/** The one condition Y/A 2025/2026 declares, read from the data not named here. */
const conditionId = conditionsForCappedIncome(taxYear)[0]!.id;

function withAnswers(patch: Partial<CalculatorState>): CalculatorState {
  return {
    ...INITIAL_STATE,
    yearOfAssessment: taxYear.yearOfAssessment,
    residency: 'resident',
    ...patch,
  };
}

function amounts(
  entries: Partial<Record<MoneyFieldId, number | null>>,
): Partial<Record<MoneyFieldId, number | null>> {
  return entries;
}

describe('the question groups', () => {
  it('gives every persona a set of sections, and every section a definition', () => {
    for (const persona of ['p1', 'p2', 'p3', 'p4', 'none', null] as const) {
      const sections = sectionsFor(persona);
      expect(sections.length).toBeGreaterThan(0);
      for (const id of sections) expect(SECTION_IDS).toContain(id);
    }
  });

  it('opens every section for "none of these", because that user is not routed', () => {
    expect(sectionsFor('none')).toEqual([...SECTION_IDS]);
  });

  it('never maps two money fields onto the same scalar engine input', () => {
    // The UI does no arithmetic. Two fields sharing a *scalar* destination
    // would have to be added together somewhere, and that sum is one no fixture
    // covers — which is why there is one APIT box and one AIT box rather than
    // one per certificate.
    //
    // Income is the exception and is not one: each income field becomes its own
    // `IncomeItem` in a list, and the engine does the summing.
    const seen = new Set<string>();
    for (const field of MONEY_FIELDS) {
      if (field.destination.kind === 'income') continue;
      const key = JSON.stringify(field.destination);
      expect(seen.has(key), `${field.id} shares a destination with another field`).toBe(
        false,
      );
      seen.add(key);
    }
  });

  it('gives every income field its own item rather than adding any two together', () => {
    const state = withAnswers({
      amounts: amounts({
        'investment-interest': 100_000,
        'investment-dividends': 200_000,
        'investment-rent': 300_000,
      }),
    });
    const built = buildTaxInput(state, taxYear);
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    expect(built.input.income.investment?.map((item) => item.amount)).toEqual([
      100_000, 200_000, 300_000,
    ]);
  });

  it('asks for qualifying payments only where the year declares some', () => {
    // Y/A 2025/2026 declares none, so the question is not asked: a box inviting
    // an amount where the data holds no types invites an invented figure.
    expect(taxYear.qualifyingPayments).toHaveLength(0);
    const asked = moneyFieldsFor(taxYear).map((field) => field.id);
    expect(asked).not.toContain('qualifying-payments');

    const withTypes: TaxYearFile = {
      ...taxYear,
      qualifyingPayments: [
        { id: 'a-type', cap: 100, rate: 100, src: Object.keys(taxYear.sources)[0]! },
      ],
    };
    expect(moneyFieldsFor(withTypes).map((field) => field.id)).toContain(
      'qualifying-payments',
    );
  });
});

describe('visibleSections', () => {
  it('shows the persona’s own sections', () => {
    const state = withAnswers({ personaId: 'p2' });
    expect(visibleSections(state, taxYear)).toContain('employment');
  });

  it('shows a section the user opened, whatever the persona', () => {
    const state = withAnswers({ personaId: 'p2', openedSections: ['investment'] });
    expect(visibleSections(state, taxYear)).toContain('investment');
  });

  it('always shows a section holding a figure, even after the persona changes', () => {
    // The invariant that makes "change persona without losing figures" safe: a
    // figure can never be off-screen while it is still being taxed.
    const entered = withAnswers({
      personaId: 'p4',
      amounts: amounts({ 'investment-interest': 500_000 }),
    });
    expect(visibleSections(entered, taxYear)).toContain('investment');

    const switched = { ...entered, personaId: 'p2' };
    expect(sectionsFor('p2')).not.toContain('investment');
    expect(visibleSections(switched, taxYear)).toContain('investment');
  });

  it('holds that invariant for every field in the catalogue', () => {
    for (const field of moneyFieldsFor(taxYear)) {
      const state = withAnswers({
        personaId: 'p2',
        amounts: amounts({ [field.id]: 1 }),
      });
      expect(
        visibleSections(state, taxYear),
        `${field.id} can hold a figure while its section is hidden`,
      ).toContain(field.section);
    }
  });
});

describe('conditions come from the data', () => {
  it('resolves the ladder the engine will use', () => {
    expect(resolveLadderId(taxYear)).toBe('individual-normal');
  });

  it('reads every condition named by a cap on that ladder', () => {
    const questions = conditionsForCappedIncome(taxYear);
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(taxYear.conditions[question.id]).toBeDefined();
      expect(question.condition.question).toBe(taxYear.conditions[question.id]!.question);
    }
  });

  it('picks up a condition added to the data, with no code change', () => {
    const capId = Object.keys(taxYear.rateCaps)[0]!;
    const cap = taxYear.rateCaps[capId]!;
    const extended = taxYearFileSchema.parse({
      ...taxYear,
      conditions: {
        ...taxYear.conditions,
        'invoiced-in-the-taxpayers-own-name': {
          question: 'Were the invoices issued in your own name?',
          ifNotMet: null,
          evidence: 'Constructed for this test; no primary source is claimed.',
          src: cap.src,
        },
      },
      rateCaps: {
        ...taxYear.rateCaps,
        [capId]: {
          ...cap,
          conditions: [...cap.conditions, 'invoiced-in-the-taxpayers-own-name'],
        },
      },
    });

    const ids = conditionsForCappedIncome(extended).map((question) => question.id);
    expect(ids).toContain('invoiced-in-the-taxpayers-own-name');
  });

  it('attaches those questions to the income fields a cap applies to', () => {
    const capped = cappedIncomeFields(taxYear);
    expect(capped.length).toBeGreaterThan(0);
    for (const field of capped) {
      expect(field.destination.kind).toBe('income');
    }
  });
});

describe('buildTaxInput', () => {
  it('asks for the year, the residency and an income figure before anything else', () => {
    const built = buildTaxInput(INITIAL_STATE, null);
    expect(built.status).toBe('incomplete');
    if (built.status !== 'incomplete') return;
    const keys = built.missing.map((item) => item.key);
    expect(keys).toContain('year');
    expect(keys).toContain('residency');
    expect(keys).toContain('income');
  });

  it('never sends an untouched field through as zero', () => {
    const built = buildTaxInput(
      withAnswers({ amounts: amounts({ 'employment-pay': 3_000_000 }) }),
      taxYear,
    );
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    expect(built.input.income.business).toBeUndefined();
    expect(built.input.income.investment).toBeUndefined();
    expect(built.input.creditsPaid).toBeUndefined();
    expect(built.input.deductions).toBeUndefined();
  });

  it('passes a typed zero through as the declared nil it is', () => {
    const built = buildTaxInput(
      withAnswers({
        amounts: amounts({ 'employment-pay': 3_000_000, 'apit-deducted': 0 }),
      }),
      taxYear,
    );
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    expect(built.input.creditsPaid).toEqual({ apit: 0 });
  });

  it('refuses to build while a condition on capped income is unanswered', () => {
    const built = buildTaxInput(
      withAnswers({ amounts: amounts({ 'business-foreign': 5_000_000 }) }),
      taxYear,
    );
    expect(built.status).toBe('incomplete');
    if (built.status !== 'incomplete') return;
    expect(built.missing.map((item) => item.key)).toContain(
      `condition:business-foreign:${conditionId}`,
    );
  });

  it('writes the condition answer onto the item it was asked about', () => {
    const built = buildTaxInput(
      withAnswers({
        amounts: amounts({ 'business-foreign': 5_000_000 }),
        conditionAnswers: { 'business-foreign': { [conditionId]: true } },
      }),
      taxYear,
    );
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    const item = built.input.income.business?.[0];
    expect(item?.tags).toContain('foreign-capped');
    expect(item?.conditions).toEqual({ [conditionId]: true });
  });

  it('requires a length of service once a leaving payment is entered', () => {
    const built = buildTaxInput(
      withAnswers({ amounts: amounts({ 'terminal-benefit': 4_000_000 }) }),
      taxYear,
    );
    expect(built.status).toBe('incomplete');
    if (built.status !== 'incomplete') return;
    expect(built.missing.map((item) => item.key)).toContain('service-years');
  });

  it('carries the length of service onto the item', () => {
    const built = buildTaxInput(
      withAnswers({
        amounts: amounts({ 'terminal-benefit': 4_000_000 }),
        text: { 'service-years': '19' },
      }),
      taxYear,
    );
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    expect(built.input.income.employment?.[0]?.serviceYears).toBe(19);
  });

  it('will not attach foreign tax without a real date for it', () => {
    const base = withAnswers({
      amounts: amounts({
        'business-foreign': 5_000_000,
        'business-foreign-tax': 200_000,
      }),
      conditionAnswers: { 'business-foreign': { [conditionId]: true } },
    });

    const noDate = buildTaxInput(base, taxYear);
    expect(noDate.status).toBe('incomplete');

    const badDate = buildTaxInput(
      { ...base, text: { 'foreign-tax-paid-on': '2026-02-30' } },
      taxYear,
    );
    expect(badDate.status).toBe('incomplete');

    const good = buildTaxInput(
      { ...base, text: { 'foreign-tax-paid-on': '2026-07-15' } },
      taxYear,
    );
    expect(good.status).toBe('ready');
    if (good.status !== 'ready') return;
    expect(good.input.income.business?.[0]?.foreignTax).toEqual({
      paid: 200_000,
      paidOn: '2026-07-15',
    });
  });

  it('offers every residency the engine knows', () => {
    for (const option of RESIDENCY_OPTIONS) {
      const built = buildTaxInput(
        withAnswers({
          residency: option.value,
          amounts: amounts({ 'employment-pay': 3_000_000 }),
        }),
        taxYear,
      );
      expect(built.status).toBe('ready');
      if (built.status !== 'ready') return;
      expect(built.input.residency).toBe(option.value);
    }
  });
});

describe('the answers the engine can act on', () => {
  it('produces a computable figure for a salary with no tax deducted (p2)', () => {
    const built = buildTaxInput(
      withAnswers({
        personaId: 'p2',
        amounts: amounts({ 'employment-pay': 3_600_000, 'apit-deducted': 0 }),
      }),
      taxYear,
    );
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    const result = computeTax(built.input, taxYear);
    expect(isRefusal(result)).toBe(false);
    expect(result.taxPayable).toBeGreaterThan(0);
  });

  it('refuses p3’s remitted branch, and computes its unremitted one', () => {
    // The persona doc's own decision path: salary plus foreign freelance income
    // is computable when the freelance income sits on the same ladder, and is
    // Q14 when it does not.
    const base = withAnswers({
      personaId: 'p3',
      amounts: amounts({ 'employment-pay': 3_600_000, 'business-foreign': 2_400_000 }),
    });

    const notRemitted = buildTaxInput(
      { ...base, conditionAnswers: { 'business-foreign': { [conditionId]: false } } },
      taxYear,
    );
    expect(notRemitted.status).toBe('ready');
    if (notRemitted.status !== 'ready') return;
    expect(isRefusal(computeTax(notRemitted.input, taxYear))).toBe(false);

    const remitted = buildTaxInput(
      { ...base, conditionAnswers: { 'business-foreign': { [conditionId]: true } } },
      taxYear,
    );
    expect(remitted.status).toBe('ready');
    if (remitted.status !== 'ready') return;
    expect(isRefusal(computeTax(remitted.input, taxYear))).toBe(true);
  });
});

describe('the two answers that are not amounts', () => {
  it('accepts a whole number of years and nothing else', () => {
    expect(parseServiceYears('19')).toBe(19);
    expect(parseServiceYears(' 0 ')).toBe(0);
    expect(parseServiceYears('19.5')).toBeNull();
    expect(parseServiceYears('nineteen')).toBeNull();
    expect(parseServiceYears('')).toBeNull();
  });

  it('accepts only a real calendar date', () => {
    expect(isRealIsoDate('2026-07-15')).toBe(true);
    expect(isRealIsoDate('2024-02-29')).toBe(true);
    expect(isRealIsoDate('2023-02-29')).toBe(false);
    expect(isRealIsoDate('2026-13-01')).toBe(false);
    expect(isRealIsoDate('15/07/2026')).toBe(false);
  });
});

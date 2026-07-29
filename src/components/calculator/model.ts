/**
 * The calculator's state, its question groups, and the one function that turns
 * what a person typed into a `TaxInput`.
 *
 * NO REACT IN THIS FILE, AND NO DOM. Everything here is a plain function over
 * plain data, so the part of the calculator most likely to be wrong — the
 * mapping from a question a human answered onto a field the engine charges tax
 * on — is testable without rendering anything. `model.test.ts` runs it in the
 * `node` environment.
 *
 * ---------------------------------------------------------------------------
 * FOUR RULES THIS FILE HOLDS
 * ---------------------------------------------------------------------------
 *
 * 1. **No arithmetic on money.** Every money field maps to exactly one engine
 *    input. Two fields never add up into one, because a sum computed here is a
 *    sum no fixture covers and it would drift from the engine silently
 *    [CLAUDE.md, `docs/spec/ui-behaviour.md`]. That is why there is one APIT
 *    field and one AIT field rather than a withholding box per certificate: the
 *    engine takes `creditsPaid.apit` and `creditsPaid.ait` as single figures.
 *
 * 2. **Empty is not zero.** An untouched field is `null` and is simply absent
 *    from the `TaxInput`. `0` is a figure the user typed — a declared nil — and
 *    is passed through as one.
 *
 * 3. **Condition questions come from the data.** Nothing here names a
 *    condition. `conditionsForCappedIncome()` reads the year's own `rateCaps`
 *    and `conditions`, so an amendment that adds a condition adds a question
 *    with no code change [CLAUDE.md rule 7]. The remittance condition is not
 *    special-cased anywhere — P11 replaces the generic rendering for one
 *    condition id, and this layer does not know which one.
 *
 * 4. **The persona routes, it does not constrain.** `sectionsFor()` decides
 *    what opens by default. `visibleSections()` adds anything the user opened
 *    *and anything holding a figure*, so changing persona can never hide a
 *    figure that is still being taxed.
 */

import {
  HEADS,
  NORMAL_LADDER_SCHEDULE_ID,
  type Head,
  type IncomeItem,
  type IncomeTag,
  type Residency,
  type TaxInput,
} from '../../lib/tax/engine.ts';
import type { Condition, TaxYearFile } from '../../lib/tax/schema.ts';

// ---------------------------------------------------------------------------
// Personas — situations, not categories
// ---------------------------------------------------------------------------

/** The escape hatch's id. `PersonaCardGroup` always renders it. */
export const NO_PERSONA_ID = 'none';

/**
 * The four cards from `docs/spec/ui-behaviour.md` §1, in its wording. Each is a
 * sentence a person could say about their own life; none of them is a statutory
 * category, because resolving those is the tool's problem and not the user's.
 */
export const PERSONAS = [
  {
    id: 'p1',
    situation: 'I work for overseas clients and get paid in foreign currency',
    covers: ['Work paid from outside Sri Lanka', 'How the money reached you', 'Expenses'],
  },
  {
    id: 'p2',
    situation: 'I am employed but no tax is deducted from my pay',
    covers: ['Pay from your job', 'Tax already deducted'],
  },
  {
    id: 'p3',
    situation: 'I have a salary and also do freelance work',
    covers: ['Pay from your job', 'Freelance work', 'How the money reached you'],
  },
  {
    id: 'p4',
    situation: 'I have interest, dividends or rent, or I sold something',
    covers: [
      'Interest, dividends and rent',
      'Something you sold',
      'A payment for leaving a job',
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Residency
// ---------------------------------------------------------------------------

/**
 * The three residency statuses the engine knows, written as situations.
 *
 * **The tool does not work residence out for anybody.** Residence is a defined
 * test in the Act and no document in this repository records it, so the
 * question is asked plainly and the hint says the tool has not checked it. What
 * turns on the answer is which reliefs apply, and that comes from each relief's
 * own `appliesTo` list in the year's data — not from anything here.
 */
export const RESIDENCY_OPTIONS: readonly {
  value: Residency;
  label: string;
  description: string;
}[] = [
  {
    value: 'resident',
    label: 'I lived in Sri Lanka for that year',
    description: 'Sri Lanka was where you were based for the year, 1 April to 31 March.',
  },
  {
    value: 'non-resident-citizen',
    label: 'I am a Sri Lankan citizen but lived outside Sri Lanka for that year',
    description: 'You kept your citizenship but were based elsewhere for the year.',
  },
  {
    value: 'non-resident',
    label: 'I lived outside Sri Lanka and am not a Sri Lankan citizen',
    description: 'Neither based in Sri Lanka nor a citizen of it for that year.',
  },
];

export const RESIDENCY_HINT =
  'Residence has a particular meaning in the law and this tool does not work it out for you. If you are not sure which of these you are, the figure below is not one to rely on until you have checked.';

// ---------------------------------------------------------------------------
// Sections — the question groups
// ---------------------------------------------------------------------------

export const SECTION_IDS = [
  'employment',
  'business',
  'investment',
  'capital-gains',
  'terminal-benefits',
  'payments',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionDefinition {
  id: SectionId;
  /** Heading, in the user's terms. */
  title: string;
  /** One line under the heading saying who the section is for. */
  blurb: string;
  /** Wording of the control that opens the section when the persona did not. */
  openLabel: string;
  /** Always rendered, whatever the persona. */
  always?: boolean;
}

export const SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'employment',
    title: 'A job you are paid for',
    blurb: 'Pay from an employer for this year of assessment.',
    openLabel: 'Add pay from a job',
  },
  {
    id: 'business',
    title: 'Work you do for yourself',
    blurb: 'Freelance, consultancy or business income, and what it cost you to earn.',
    openLabel: 'Add work you do for yourself',
  },
  {
    id: 'investment',
    title: 'Interest, dividends and rent',
    blurb: 'Income from money and property rather than from work.',
    openLabel: 'Add interest, dividends or rent',
  },
  {
    id: 'capital-gains',
    title: 'Something you sold',
    blurb: 'A gain on selling an asset such as property or shares.',
    openLabel: 'Add something you sold',
  },
  {
    id: 'terminal-benefits',
    title: 'A payment for leaving a job',
    blurb: 'A gratuity, compensation, or a payment out of a fund on leaving employment.',
    openLabel: 'Add a payment for leaving a job',
  },
  {
    id: 'payments',
    title: 'Tax already paid, and anything you have declared',
    blurb: 'Tax someone else has already taken off, and figures you have filed yourself.',
    openLabel: 'Add tax already paid',
    always: true,
  },
];

/**
 * Which sections a persona opens by default.
 *
 * A routing convenience and nothing more: every section is reachable from every
 * persona, and `visibleSections()` is what actually decides what is on screen.
 * An unrecognised persona id — including the "none of these" escape hatch —
 * opens everything, which is the safe direction to be wrong in.
 */
const PERSONA_SECTIONS: Readonly<Record<string, readonly SectionId[]>> = {
  p1: ['business'],
  p2: ['employment'],
  p3: ['employment', 'business'],
  p4: ['investment', 'capital-gains', 'terminal-benefits'],
};

export function sectionsFor(personaId: string | null): readonly SectionId[] {
  const always = SECTIONS.filter((s) => s.always).map((s) => s.id);
  if (personaId === null) return always;
  const chosen = PERSONA_SECTIONS[personaId];
  if (!chosen) return SECTION_IDS;
  return [...chosen, ...always];
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

/**
 * Where one money field lands in `TaxInput`. Exactly one destination per field,
 * and never two fields on the same destination — see rule 1 in the header.
 */
export type MoneyDestination =
  | { kind: 'income'; head: Head; tags?: readonly IncomeTag[] }
  | { kind: 'deduction'; head: Head }
  | { kind: 'credit'; which: 'apit' | 'ait' }
  | { kind: 'qualifying-payments' }
  | { kind: 'estimate' }
  /** Foreign tax paid on the source entered in `source`. */
  | { kind: 'foreign-tax'; source: MoneyFieldId };

export interface MoneyField {
  id: MoneyFieldId;
  section: SectionId;
  label: string;
  hint: string;
  destination: MoneyDestination;
  /** Every field is optional: a person answers the ones that are about them. */
  optional?: boolean;
  /** Only render this field when the year's data makes it meaningful. */
  showFor?: (taxYear: TaxYearFile) => boolean;
}

export type MoneyFieldId =
  | 'employment-pay'
  | 'business-foreign'
  | 'business-foreign-tax'
  | 'business-local'
  | 'business-expenses'
  | 'investment-interest'
  | 'investment-dividends'
  | 'investment-rent'
  | 'investment-rent-expenses'
  | 'capital-gain'
  | 'terminal-benefit'
  | 'apit-deducted'
  | 'investment-wht'
  | 'qualifying-payments'
  | 'own-estimate';

/**
 * The questions, in the order they are asked, drawn from each persona's "What
 * the calculator must ask" list.
 *
 * The wording is deliberately about what happened to the person, not about how
 * the Act classifies it — "Paid by clients outside Sri Lanka" rather than
 * "service export income" [`docs/spec/ui-behaviour.md`, Principles].
 */
export const MONEY_FIELDS: readonly MoneyField[] = [
  {
    id: 'employment-pay',
    section: 'employment',
    label: 'Pay from your job for the whole year',
    hint: 'The gross figure — everything your employer paid you or gave you in kind, before anything was taken off. Not the amount that reached your account.',
    destination: { kind: 'income', head: 'employment' },
  },

  {
    id: 'business-foreign',
    section: 'business',
    label: 'Paid to you by clients outside Sri Lanka, in foreign currency',
    hint: 'The total for the year, converted to rupees. This tool does not convert currency for you, and it does not hold an exchange rate.',
    destination: { kind: 'income', head: 'business', tags: ['foreign-capped'] },
  },
  {
    id: 'business-foreign-tax',
    section: 'business',
    label: 'Tax another country already took off that money',
    hint: 'In rupees, from the certificate or statement the overseas payer gave you. Leave it empty if none was taken.',
    destination: { kind: 'foreign-tax', source: 'business-foreign' },
    optional: true,
  },
  {
    id: 'business-local',
    section: 'business',
    label: 'Paid to you by clients in Sri Lanka',
    hint: 'The total for the year, before anything was withheld.',
    destination: { kind: 'income', head: 'business' },
  },
  {
    id: 'business-expenses',
    section: 'business',
    label: 'What it cost you to do that work',
    hint: 'Equipment, internet, software, a share of the home you work from, bank charges. Enter what you can support with a record.',
    destination: { kind: 'deduction', head: 'business' },
    optional: true,
  },

  {
    id: 'investment-interest',
    section: 'investment',
    label: 'Interest, before any tax was taken off',
    hint: 'The gross figure on your bank certificate, not the amount credited to your account. Entering the net figure and also claiming the tax below would relieve the same tax twice.',
    destination: { kind: 'income', head: 'investment' },
  },
  {
    id: 'investment-dividends',
    section: 'investment',
    label: 'Dividends, before any tax was taken off',
    hint: 'The gross figure on the dividend statement.',
    destination: { kind: 'income', head: 'investment' },
  },
  {
    id: 'investment-rent',
    section: 'investment',
    label: 'Rent you received',
    hint: 'The total rent for the year, before expenses.',
    destination: { kind: 'income', head: 'investment' },
  },
  {
    id: 'investment-rent-expenses',
    section: 'investment',
    label: 'Expenses against that rent',
    hint: 'Repairs, rates and other costs of letting the property.',
    destination: { kind: 'deduction', head: 'investment' },
    optional: true,
  },

  {
    id: 'capital-gain',
    section: 'capital-gains',
    label: 'The gain you made on what you sold',
    hint: 'The gain itself, not the sale price. This tool does not work the gain out from the price you sold at and what the asset cost you — that calculation is not built yet, and a figure it guessed at would be worse than none.',
    destination: { kind: 'income', head: 'investment', tags: ['capital-gain'] },
  },

  {
    id: 'terminal-benefit',
    section: 'terminal-benefits',
    label: 'The payment you received for leaving',
    hint: 'Gratuity, compensation for loss of office, and payments out of a provident or pension fund, added together as one figure.',
    destination: { kind: 'income', head: 'employment', tags: ['terminal-benefit'] },
  },

  {
    id: 'apit-deducted',
    section: 'payments',
    label: 'Tax an employer already deducted from what they paid you',
    hint: 'From your payslips or your deduction certificate. If nothing was deducted, enter 0 — that is an ordinary answer and not a mistake.',
    destination: { kind: 'credit', which: 'apit' },
    optional: true,
  },
  {
    id: 'investment-wht',
    section: 'payments',
    label: 'Tax already withheld on interest, dividends or rent',
    hint: 'The total shown on your certificates, as one figure. Only include tax you can support with a certificate.',
    destination: { kind: 'credit', which: 'ait' },
    optional: true,
  },
  {
    id: 'qualifying-payments',
    section: 'payments',
    label: 'Qualifying payments you are entitled to deduct',
    hint: 'The amount you are entitled to deduct, not the amount you paid. This tool does not work out the entitlement for you.',
    destination: { kind: 'qualifying-payments' },
    optional: true,
    // Asked only where the year's own data declares qualifying payment types.
    // With none declared there is nothing here to claim, and a box inviting a
    // figure would invite an invented one.
    showFor: (taxYear) => taxYear.qualifyingPayments.length > 0,
  },
  {
    id: 'own-estimate',
    section: 'payments',
    label: 'Your own estimate of the tax payable for this year, if you have filed one',
    hint: 'Instalments are worked out from the estimate you filed, not from the figure this tool produces. Leave it empty if you have not filed one.',
    destination: { kind: 'estimate' },
    optional: true,
  },
];

/** Money fields that are asked for the given year. */
export function moneyFieldsFor(taxYear: TaxYearFile | null): readonly MoneyField[] {
  if (!taxYear) return MONEY_FIELDS.filter((f) => !f.showFor);
  return MONEY_FIELDS.filter((f) => (f.showFor ? f.showFor(taxYear) : true));
}

/**
 * The two questions that are not amounts.
 *
 * Kept apart from `MONEY_FIELDS` rather than given a `type` discriminator,
 * because they are answered with a `TextField` and validated by their own rule.
 * Neither is money and neither may ever be rendered with `CurrencyField`.
 */
export const TEXT_FIELD_IDS = ['service-years', 'foreign-tax-paid-on'] as const;
export type TextFieldId = (typeof TEXT_FIELD_IDS)[number];

// ---------------------------------------------------------------------------
// Element ids
// ---------------------------------------------------------------------------

/**
 * Ids are derived, in one place, rather than written twice.
 *
 * The result panel lists what is still to answer and links each item to the
 * control that answers it. That link is only worth having if it lands on the
 * right element, so the id a component renders and the id the link points at
 * come from the same function.
 */
export const YEAR_FIELD_ID = 'calc-year';
export const RESIDENCY_GROUP_ID = 'calc-residency';

export function moneyFieldElementId(id: MoneyFieldId): string {
  return `calc-${id}`;
}

export function textFieldElementId(id: TextFieldId): string {
  return `calc-${id}`;
}

/**
 * The two answers a generic condition question offers. `'yes'`/`'no'` on the
 * wire, `boolean` in the model — translated in `ConditionQuestions.tsx` and
 * nowhere else.
 */
export const CONDITION_ANSWER = { yes: 'yes', no: 'no' } as const;

/** The radio group a condition is answered in, and its first option. */
export function conditionGroupId(fieldId: MoneyFieldId, conditionId: string): string {
  return `calc-${fieldId}-${conditionId}`;
}

/**
 * The first option of whichever group answers this condition.
 *
 * `RadioCardGroup` gives each item `${groupId}-${option.value}`, so on the
 * generic yes/no path this resolves on its own. A rendering whose options are
 * not yes/no — the route picker — carries the id across explicitly with
 * `RadioCardOption.optionId`, so the "still to answer" link lands on a real
 * control whichever rendering is in use.
 */
export function conditionFirstOptionId(
  fieldId: MoneyFieldId,
  conditionId: string,
): string {
  return `${conditionGroupId(fieldId, conditionId)}-${CONDITION_ANSWER.yes}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface CalculatorState {
  personaId: string | null;
  yearOfAssessment: string | null;
  residency: Residency | null;
  /** Sections the user opened themselves. Never emptied by a persona change. */
  openedSections: readonly SectionId[];
  /** Integer rupees or `null` for "not entered". Never a string, never a float. */
  amounts: Readonly<Partial<Record<MoneyFieldId, number | null>>>;
  /** Raw text for the non-money questions, exactly as typed. */
  text: Readonly<Partial<Record<TextFieldId, string>>>;
  /**
   * Condition answers, per income field and then per condition id — the same
   * shape as `IncomeItem.conditions`, because one taxpayer can have one source
   * that meets a condition and another that does not.
   */
  conditionAnswers: Readonly<
    Partial<Record<MoneyFieldId, Readonly<Record<string, boolean>>>>
  >;
  /**
   * Where a condition is answered by describing what happened rather than by a
   * yes/no, which of those descriptions the user picked — per income field and
   * then per condition id, the same shape as `conditionAnswers`.
   *
   * **The strings are opaque here.** This layer does not know what any of them
   * mean, for the same reason it does not know which condition is special: the
   * component that renders them owns their meaning
   * (`remittance-routes.ts`), and `compute.ts` owns the one that refuses.
   * `conditionAnswers` is still the only thing `buildTaxInput` reads, so a
   * description that settles the condition sets an answer there too, and one
   * that does not leaves it genuinely unanswered.
   */
  conditionRoutes: Readonly<
    Partial<Record<MoneyFieldId, Readonly<Record<string, string>>>>
  >;
  /**
   * Amounts written against an individual route, per income field and then per
   * route id.
   *
   * **Recorded only.** Nothing here reaches `TaxInput`, nothing adds them up,
   * and no figure on the page is derived from them — see rule 1 in the header.
   * They exist because the one case that collects them is the case where no
   * figure can be produced at all, and the user needs the facts written down to
   * take somewhere else.
   */
  routeAmounts: Readonly<
    Partial<Record<MoneyFieldId, Readonly<Record<string, number | null>>>>
  >;
  /** Fields whose current entry could not be read. See `ui-behaviour.md`'s
   * invalid state: the last valid figure stands, visibly marked stale. */
  unreadableFields: readonly MoneyFieldId[];
}

export const INITIAL_STATE: CalculatorState = {
  personaId: null,
  yearOfAssessment: null,
  residency: null,
  openedSections: [],
  amounts: {},
  text: {},
  conditionAnswers: {},
  conditionRoutes: {},
  routeAmounts: {},
  unreadableFields: [],
};

/**
 * What is on screen.
 *
 * Three ways in, and the third is the one that matters: **a section holding a
 * figure is always visible**, whatever the persona. Without it, switching
 * persona could leave an entered amount off-screen while it was still being
 * taxed — the figure would not be lost, but it would be invisible, which is
 * worse than losing it.
 */
export function visibleSections(
  state: CalculatorState,
  taxYear: TaxYearFile | null,
): readonly SectionId[] {
  const fromPersona = new Set(sectionsFor(state.personaId));
  const opened = new Set(state.openedSections);
  const holdingAFigure = new Set(
    moneyFieldsFor(taxYear)
      .filter((field) => (state.amounts[field.id] ?? null) !== null)
      .map((field) => field.section),
  );
  return SECTION_IDS.filter(
    (id) => fromPersona.has(id) || opened.has(id) || holdingAFigure.has(id),
  );
}

// ---------------------------------------------------------------------------
// Conditions, read from the year's own data
// ---------------------------------------------------------------------------

/**
 * The ladder the engine will resolve for this year, mirroring
 * `resolveLadder()`'s first two rules. `null` where it cannot be resolved
 * without an explicit `scheduleId` — in which case the caller asks every
 * condition the year declares on any cap, since over-asking is recoverable and
 * under-asking silently moves income between rates.
 */
export function resolveLadderId(taxYear: TaxYearFile): string | null {
  if (taxYear.rateSchedules[NORMAL_LADDER_SCHEDULE_ID]) return NORMAL_LADDER_SCHEDULE_ID;
  const ids = Object.keys(taxYear.rateSchedules);
  return ids.length === 1 ? (ids[0] ?? null) : null;
}

export interface ConditionQuestion {
  /** The condition's key in `taxYear.conditions`. */
  id: string;
  /** The condition itself, verbatim from the data — question, evidence, src. */
  condition: Condition;
  /** The rate cap that turns on it, for the explanation beside the question. */
  capId: string;
  capLabel: string;
}

/**
 * Every condition that has to be answered for income carrying the
 * `foreign-capped` tag, read out of the year's own `rateCaps` and `conditions`.
 *
 * **Nothing here names a condition.** Add `conditions: ["a-new-condition"]` to a
 * cap in a data file, declare that condition, and the question appears — no
 * component changes, which is the promise `docs/spec/data-model.md` exists to
 * keep and is the acceptance test for this prompt.
 *
 * A cap naming a condition the year does not declare is skipped here rather
 * than rendered blank: the engine throws on exactly that case with a message
 * naming the cap, which is the right place for a data fault to surface.
 */
export function conditionsForCappedIncome(
  taxYear: TaxYearFile,
): readonly ConditionQuestion[] {
  const ladderId = resolveLadderId(taxYear);
  const out: ConditionQuestion[] = [];
  const seen = new Set<string>();

  for (const [capId, cap] of Object.entries(taxYear.rateCaps)) {
    if (ladderId !== null && cap.appliesToSchedule !== ladderId) continue;
    for (const conditionId of cap.conditions) {
      if (seen.has(conditionId)) continue;
      const condition = taxYear.conditions[conditionId];
      if (!condition) continue;
      seen.add(conditionId);
      out.push({ id: conditionId, condition, capId, capLabel: cap.label });
    }
  }

  return out;
}

/** Income fields whose amount carries a tag a rate cap applies to. */
export function cappedIncomeFields(taxYear: TaxYearFile | null): readonly MoneyField[] {
  return moneyFieldsFor(taxYear).filter(
    (field) =>
      field.destination.kind === 'income' &&
      (field.destination.tags?.includes('foreign-capped') ?? false),
  );
}

// ---------------------------------------------------------------------------
// Validating the two text answers — integer arithmetic, no Date object
// ---------------------------------------------------------------------------

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function daysInMonth(year: number, month: number): number {
  if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) return 29;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

/**
 * `true` for a real calendar date written `YYYY-MM-DD`.
 *
 * No `Date` object: a `Date` is an instant resolved against a timezone, and
 * "15 July 2026" is not an instant. Same reasoning as the engine's own calendar
 * arithmetic, and the same reason `new Date('2026-02-30')` cannot be used as a
 * check — it does not throw, it rolls over to 2 March.
 */
export function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match?.[1] || !match[2] || !match[3]) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

/** Whole years of service, or `null` when the entry cannot be read as one. */
export function parseServiceYears(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const years = Number(trimmed);
  return Number.isSafeInteger(years) ? years : null;
}

export const TEXT_FIELD_MESSAGES = {
  serviceYears:
    'Enter your length of service as a whole number of years, such as 19. The tables the law uses are chosen by that number, so it cannot be left out once a leaving payment has been entered.',
  paidOn:
    'Enter the date the overseas tax was paid as year-month-day, such as 2026-07-15.',
} as const;

// ---------------------------------------------------------------------------
// Building the TaxInput
// ---------------------------------------------------------------------------

export interface MissingAnswer {
  /** Stable key, distinguishing one gap from another. */
  key: string;
  /** What is still needed, in the user's terms. */
  what: string;
  /**
   * The `id` of the control that answers it, where there is one. The result
   * panel's summary links to it, so "submitting with errors focuses a summary
   * at the top listing each problem as a link"
   * [`docs/spec/ui-behaviour.md`, Validation] is a link that actually lands
   * somewhere.
   */
  focusId?: string;
}

export type BuildResult =
  | { status: 'ready'; input: TaxInput }
  | { status: 'incomplete'; missing: readonly MissingAnswer[] };

function amountOf(state: CalculatorState, id: MoneyFieldId): number | null {
  return state.amounts[id] ?? null;
}

/**
 * Turn the answers into a `TaxInput`, or say what is still missing.
 *
 * Deliberately **not** a partial computation. Where an answer the engine
 * requires is absent — an unanswered condition, a leaving payment with no
 * length of service — this returns `incomplete` rather than passing the gap on
 * with a default. The engine throws on both of those, and for the right reason:
 * an unanswered condition is not a "no", and there is no safe default length of
 * service. Reporting them as questions still to answer is the same position,
 * said in a way a person can act on.
 */
export function buildTaxInput(
  state: CalculatorState,
  taxYear: TaxYearFile | null,
): BuildResult {
  const missing: MissingAnswer[] = [];

  if (!taxYear || state.yearOfAssessment === null) {
    missing.push({
      key: 'year',
      what: 'the year of assessment you are working out',
      focusId: YEAR_FIELD_ID,
    });
  }
  if (state.residency === null) {
    missing.push({
      key: 'residency',
      what: 'whether you lived in Sri Lanka that year',
      focusId: `${RESIDENCY_GROUP_ID}-${RESIDENCY_OPTIONS[0]?.value ?? ''}`,
    });
  }

  const fields = moneyFieldsFor(taxYear);
  const income: Partial<Record<Head, IncomeItem[]>> = {};
  const deductions: Partial<Record<Head, number>> = {};
  const credits: { apit?: number; ait?: number } = {};
  let qualifyingPayments: number | undefined;
  let estimate: number | undefined;
  let anyIncome = false;

  const conditionQuestions = taxYear ? conditionsForCappedIncome(taxYear) : [];

  for (const field of fields) {
    const amount = amountOf(state, field.id);
    if (amount === null) continue;
    const destination = field.destination;

    switch (destination.kind) {
      case 'income': {
        anyIncome = true;
        const item: {
          label: string;
          amount: number;
          tags?: readonly IncomeTag[];
          serviceYears?: number;
          conditions?: Record<string, boolean>;
          foreignTax?: { paid: number; paidOn: string };
        } = { label: field.label, amount };

        if (destination.tags) item.tags = destination.tags;

        if (destination.tags?.includes('terminal-benefit')) {
          const years = parseServiceYears(state.text['service-years'] ?? '');
          if (years === null) {
            missing.push({
              key: 'service-years',
              what: 'how many whole years you worked there, which chooses the table the law applies to a leaving payment',
              focusId: textFieldElementId('service-years'),
            });
          } else {
            item.serviceYears = years;
          }
        }

        if (destination.tags?.includes('foreign-capped')) {
          const answers: Record<string, boolean> = {};
          for (const question of conditionQuestions) {
            const answer = state.conditionAnswers[field.id]?.[question.id];
            if (answer === undefined) {
              missing.push({
                key: `condition:${field.id}:${question.id}`,
                what: question.condition.question,
                focusId: conditionFirstOptionId(field.id, question.id),
              });
            } else {
              answers[question.id] = answer;
            }
          }
          if (Object.keys(answers).length > 0) item.conditions = answers;
        }

        // Foreign tax hangs off the source it was paid on, never off the input
        // as a whole: the credit is capped per source [IRA s.81(1)].
        const foreignTaxField = fields.find(
          (f) =>
            f.destination.kind === 'foreign-tax' && f.destination.source === field.id,
        );
        if (foreignTaxField) {
          const paid = amountOf(state, foreignTaxField.id);
          if (paid !== null) {
            const paidOn = (state.text['foreign-tax-paid-on'] ?? '').trim();
            if (!isRealIsoDate(paidOn)) {
              missing.push({
                key: 'foreign-tax-paid-on',
                what: 'the date the overseas tax was paid — whether credit is allowed for it turns on when it was paid',
                focusId: textFieldElementId('foreign-tax-paid-on'),
              });
            } else {
              item.foreignTax = { paid, paidOn };
            }
          }
        }

        (income[destination.head] ??= []).push(item as IncomeItem);
        break;
      }

      case 'deduction':
        deductions[destination.head] = amount;
        break;

      case 'credit':
        credits[destination.which] = amount;
        break;

      case 'qualifying-payments':
        qualifyingPayments = amount;
        break;

      case 'estimate':
        estimate = amount;
        break;

      case 'foreign-tax':
        // Attached above, to the source it was paid on.
        break;
    }
  }

  if (!anyIncome) {
    missing.push({
      key: 'income',
      what: 'at least one income figure — nothing has been worked out because nothing has been entered',
    });
  }

  if (missing.length > 0) return { status: 'incomplete', missing };

  const input: TaxInput = {
    // Both are non-null: a null residency or year is in `missing` above.
    residency: state.residency as Residency,
    income,
  };
  if (Object.keys(deductions).length > 0) input.deductions = deductions;
  if (Object.keys(credits).length > 0) input.creditsPaid = credits;
  if (qualifyingPayments !== undefined) input.qualifyingPayments = qualifyingPayments;
  if (estimate !== undefined) input.estimatedTaxForInstalments = estimate;

  return { status: 'ready', input };
}

/** Every head with at least one item, for the sanity checks in the tests. */
export function headsUsed(input: TaxInput): readonly Head[] {
  return HEADS.filter((head) => (input.income[head]?.length ?? 0) > 0);
}

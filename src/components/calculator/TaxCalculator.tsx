/**
 * The calculator. One island, holding every answer, from the persona picker to
 * the figure.
 *
 * ---------------------------------------------------------------------------
 * WHY ONE ISLAND AND NOT TWO PAGES
 * ---------------------------------------------------------------------------
 *
 * `docs/spec/site-architecture.md` sketches a persona picker at `/calculator/`
 * and the calculator itself at `/calculator/[persona]`. That sketch predates
 * any code and it cannot satisfy this prompt's own acceptance criterion: "a
 * user can change persona mid-flow without losing entered figures". A change of
 * persona would be a navigation between two prerendered pages, and everything
 * typed would be gone. `docs/spec/ui-behaviour.md` draws it correctly — "change
 * persona" is an arrow looping back inside one flow, not a route change.
 *
 * So: one page, one island, all state here, and the persona is a value in it.
 * Changing it cannot lose a figure because nothing unmounts and nothing
 * navigates — asserted in `TaxCalculator.test.tsx`.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE TAX DATA COMES FROM
 * ---------------------------------------------------------------------------
 *
 * A prop. `loadTaxYears()` reads the filesystem with `node:fs` and is
 * build-time only; calling it from a component that ships to the browser would
 * not work at all. `src/pages/calculator/index.astro` calls it server-side and
 * hands the parsed years in as plain data.
 *
 * ---------------------------------------------------------------------------
 * NOTHING LEAVES THE BROWSER
 * ---------------------------------------------------------------------------
 *
 * No `fetch`, no `XMLHttpRequest`, no `sendBeacon`, no analytics, and no
 * storage — not even `localStorage`, so a shared machine keeps no record of
 * what anyone entered. `no-network.test.ts` scans this directory and the page
 * for every one of those, so the guarantee survives a later edit that forgets
 * it.
 *
 * ---------------------------------------------------------------------------
 * RECOMPUTATION
 * ---------------------------------------------------------------------------
 *
 * Debounced 300ms [`docs/spec/ui-behaviour.md`, valid state]. The debounce is
 * here rather than in `CurrencyField`, which says so itself: a field that
 * debounced its own `onChange` would make every consumer wait, including the
 * ones that want the keystroke.
 *
 * The figure lands in `RefusalPanel`'s `aria-live="polite"` region. There is
 * exactly one live region for the result — a second one would announce the same
 * figure twice.
 */

import { useEffect, useMemo, useState } from 'react';
import { compute, type Computation } from './compute.ts';
import { IncomeSection } from './IncomeSections.tsx';
import {
  INITIAL_STATE,
  PERSONAS,
  RESIDENCY_GROUP_ID,
  RESIDENCY_HINT,
  RESIDENCY_OPTIONS,
  SECTIONS,
  YEAR_FIELD_ID,
  cappedIncomeFields,
  conditionsForCappedIncome,
  moneyFieldsFor,
  visibleSections,
  type CalculatorState,
  type MoneyFieldId,
  type SectionId,
  type TextFieldId,
} from './model.ts';
import { ResultStep } from './ResultStep.tsx';
import {
  Button,
  Card,
  PersonaCardGroup,
  ProgressIndicator,
  RadioCardGroup,
  Stepper,
  YearSelector,
  toYearOption,
  type Step,
  type StepStatus,
} from '../ui/index.ts';
import type { Residency } from '../../lib/tax/engine.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './calculator.css';

/** How long the result waits after the last answer changed. */
export const RECOMPUTE_DEBOUNCE_MS = 300;

const STEP_IDS = ['situation', 'year', 'about-you', 'income', 'result'] as const;
type StepId = (typeof STEP_IDS)[number];

const STEP_LABELS: Record<StepId, string> = {
  situation: 'Your situation',
  year: 'Year of assessment',
  'about-you': 'Where you lived',
  income: 'What you were paid',
  result: 'What that comes to',
};

const stepHeadingId = (step: StepId): string => `calc-step-${step}`;
const sectionHeadingId = (section: SectionId): string => `calc-section-${section}`;

export interface TaxCalculatorProps {
  /**
   * Every year of assessment this build holds, parsed and validated at build
   * time. Plain data — no functions, no class instances — so Astro can
   * serialise it into the island.
   */
  taxYears: readonly TaxYearFile[];
}

export function TaxCalculator({ taxYears }: TaxCalculatorProps) {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  /**
   * Whether unanswered questions are shown as errors on the controls
   * themselves. False until the user asks — flagging a question the moment the
   * income above it is typed tells somebody they are wrong before they have had
   * a chance to be right.
   */
  const [gapsRequested, setGapsRequested] = useState(false);
  const [computation, setComputation] = useState<Computation | null>(null);
  /** An element to move focus to once the render that creates it has landed. */
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  const taxYear =
    taxYears.find((year) => year.yearOfAssessment === state.yearOfAssessment) ?? null;

  const yearOptions = useMemo(() => taxYears.map(toYearOption), [taxYears]);
  const fields = useMemo(() => moneyFieldsFor(taxYear), [taxYear]);
  const conditionQuestions = useMemo(
    () => (taxYear ? conditionsForCappedIncome(taxYear) : []),
    [taxYear],
  );
  const cappedFieldIds = useMemo(
    () => cappedIncomeFields(taxYear).map((field) => field.id),
    [taxYear],
  );
  const shown = visibleSections(state, taxYear);

  // -- recomputation, debounced -------------------------------------------

  useEffect(() => {
    const handle = setTimeout(() => {
      setComputation(compute(state, taxYear));
    }, RECOMPUTE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [state, taxYear]);

  // -- focus management ----------------------------------------------------

  function focusById(id: string): void {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(id);
    if (!element) return;
    element.focus();
    element.scrollIntoView({ block: 'center' });
  }

  useEffect(() => {
    if (pendingFocusId === null) return;
    focusById(pendingFocusId);
    setPendingFocusId(null);
  }, [pendingFocusId]);

  // -- updates -------------------------------------------------------------

  const setAmount = (id: MoneyFieldId, value: number | null) =>
    setState((prev) => ({ ...prev, amounts: { ...prev.amounts, [id]: value } }));

  /** Which fields cannot currently be read, so the figure can be marked stale. */
  const setAmountValidity = (id: MoneyFieldId, valid: boolean) =>
    setState((prev) => {
      const without = prev.unreadableFields.filter((field) => field !== id);
      if (valid && without.length === prev.unreadableFields.length) return prev;
      return { ...prev, unreadableFields: valid ? without : [...without, id] };
    });

  const setText = (id: TextFieldId, value: string) =>
    setState((prev) => ({ ...prev, text: { ...prev.text, [id]: value } }));

  const setConditionAnswer = (
    fieldId: MoneyFieldId,
    conditionId: string,
    answer: boolean,
  ) =>
    setState((prev) => ({
      ...prev,
      conditionAnswers: {
        ...prev.conditionAnswers,
        [fieldId]: { ...prev.conditionAnswers[fieldId], [conditionId]: answer },
      },
    }));

  /**
   * A condition answered by describing what happened rather than by a yes/no.
   *
   * Two things move together, in one update, so there is never a render in
   * which the description and the answer disagree: the description is recorded,
   * and the condition answer that follows from it is set — or **removed**,
   * where the description settles nothing. Removing it is the case that
   * matters: an unresolved route leaves the condition genuinely unanswered, the
   * computation stays incomplete, and the result panel goes on listing the
   * question. Nothing here knows what any of the descriptions are.
   */
  const setRouteAnswer = (
    fieldId: MoneyFieldId,
    conditionId: string,
    routeId: string,
    answer: boolean | null,
  ) =>
    setState((prev) => {
      const answers = { ...prev.conditionAnswers[fieldId] };
      if (answer === null) delete answers[conditionId];
      else answers[conditionId] = answer;
      return {
        ...prev,
        conditionAnswers: { ...prev.conditionAnswers, [fieldId]: answers },
        conditionRoutes: {
          ...prev.conditionRoutes,
          [fieldId]: { ...prev.conditionRoutes[fieldId], [conditionId]: routeId },
        },
      };
    });

  /** Recorded against the route, and never read by anything that computes. */
  const setRouteAmount = (fieldId: MoneyFieldId, routeId: string, value: number | null) =>
    setState((prev) => ({
      ...prev,
      routeAmounts: {
        ...prev.routeAmounts,
        [fieldId]: { ...prev.routeAmounts[fieldId], [routeId]: value },
      },
    }));

  /**
   * Changing persona changes **one field**. Amounts, condition answers, the
   * year and the residency are all untouched, which is what makes the persona a
   * routing convenience rather than a commitment.
   */
  const setPersona = (personaId: string) => setState((prev) => ({ ...prev, personaId }));

  const openSection = (id: SectionId) => {
    setState((prev) =>
      prev.openedSections.includes(id)
        ? prev
        : { ...prev, openedSections: [...prev.openedSections, id] },
    );
    setPendingFocusId(sectionHeadingId(id));
  };

  // -- progress ------------------------------------------------------------

  const anyAmountEntered = fields.some(
    (field) => (state.amounts[field.id] ?? null) !== null,
  );
  const refused =
    computation?.status === 'computed' && computation.result.refusals.length > 0;

  const stepStatus: Record<StepId, StepStatus> = {
    situation: state.personaId !== null ? 'complete' : 'current',
    year:
      state.yearOfAssessment !== null
        ? 'complete'
        : state.personaId !== null
          ? 'current'
          : 'upcoming',
    'about-you':
      state.residency !== null
        ? 'complete'
        : state.yearOfAssessment !== null
          ? 'current'
          : 'upcoming',
    income: anyAmountEntered
      ? 'complete'
      : state.residency !== null
        ? 'current'
        : 'upcoming',
    result:
      refused || computation?.status === 'uncomputable'
        ? 'attention'
        : computation?.status === 'computed'
          ? 'complete'
          : anyAmountEntered
            ? 'current'
            : 'upcoming',
  };

  const steps: Step[] = STEP_IDS.map((id) => {
    const step: Step = { id, label: STEP_LABELS[id], status: stepStatus[id] };
    if (stepStatus[id] !== 'upcoming') {
      step.onSelect = () => focusById(stepHeadingId(id));
    }
    return step;
  });

  const completedSteps = STEP_IDS.filter((id) => stepStatus[id] === 'complete').length;

  // -- what is on screen ---------------------------------------------------

  const missing = computation?.status === 'incomplete' ? computation.missing : [];
  const showYear = state.personaId !== null;
  const showAboutYou = showYear && state.yearOfAssessment !== null;
  const showIncome = showAboutYou && state.residency !== null;
  const closedSections = SECTIONS.filter((section) => !shown.includes(section.id));

  return (
    <div className="calc">
      {/*
        Everything except the result panel, in one wrapper: above 1024px
        `.calc` becomes a row of two columns (`calculator.css`), and this is
        the left one. The result section is the only element outside it, so it
        can be the sticky right column without a grid-row span picking up
        content it does not own.
      */}
      <div className="calc-main">
        <Stepper ariaLabel="Progress through the calculator" steps={steps} />
        <ProgressIndicator
          value={completedSteps}
          max={STEP_IDS.length}
          label={`${completedSteps} of ${STEP_IDS.length} steps answered`}
        />

        {/* -- 1. Situation ------------------------------------------------- */}
        <section className="calc-step" aria-labelledby={stepHeadingId('situation')}>
          <h2 className="calc-step__title" id={stepHeadingId('situation')} tabIndex={-1}>
            {STEP_LABELS.situation}
          </h2>
          <Card>
            <PersonaCardGroup
              legend="Which of these sounds most like you?"
              hint="This only decides which questions open first. Every question stays available whichever you pick, and changing it later keeps everything you have already entered."
              personas={PERSONAS}
              value={state.personaId}
              onValueChange={setPersona}
            />
          </Card>
        </section>

        {/* -- 2. Year of assessment ---------------------------------------- */}
        {showYear && (
          <section className="calc-step" aria-labelledby={stepHeadingId('year')}>
            <h2 className="calc-step__title" id={stepHeadingId('year')} tabIndex={-1}>
              {STEP_LABELS.year}
            </h2>
            <Card>
              <YearSelector
                id={YEAR_FIELD_ID}
                years={yearOptions}
                value={state.yearOfAssessment}
                onChange={(yearOfAssessment) =>
                  setState((prev) => ({ ...prev, yearOfAssessment }))
                }
                headingLevel={3}
              />
            </Card>
          </section>
        )}

        {/* -- 3. Where you lived ------------------------------------------- */}
        {showAboutYou && (
          <section className="calc-step" aria-labelledby={stepHeadingId('about-you')}>
            <h2
              className="calc-step__title"
              id={stepHeadingId('about-you')}
              tabIndex={-1}
            >
              {STEP_LABELS['about-you']}
            </h2>
            <Card>
              <RadioCardGroup
                id={RESIDENCY_GROUP_ID}
                legend="Where did you live for that year of assessment?"
                hint={RESIDENCY_HINT}
                value={state.residency}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, residency: value as Residency }))
                }
                options={RESIDENCY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                }))}
              />
            </Card>
          </section>
        )}

        {/* -- 4. What you were paid ---------------------------------------- */}
        {showIncome && (
          <section className="calc-step" aria-labelledby={stepHeadingId('income')}>
            <h2 className="calc-step__title" id={stepHeadingId('income')} tabIndex={-1}>
              {STEP_LABELS.income}
            </h2>
            <p className="calc-step__lede">
              Enter whichever of these are about you, and leave the rest empty. An empty
              box is not a zero — it means you have not told us about that, and nothing is
              worked out from it.
            </p>

            {shown.map((sectionId) => {
              const section = SECTIONS.find((candidate) => candidate.id === sectionId);
              if (!section) return null;
              return (
                <Card key={sectionId}>
                  <IncomeSection
                    section={section}
                    fields={fields.filter((field) => field.section === sectionId)}
                    state={state}
                    conditionQuestions={conditionQuestions}
                    cappedFieldIds={cappedFieldIds}
                    sources={taxYear?.sources ?? {}}
                    showGapsAsErrors={gapsRequested}
                    onAmountChange={setAmount}
                    onAmountValidity={setAmountValidity}
                    onTextChange={setText}
                    onConditionAnswer={setConditionAnswer}
                    onRouteAnswer={setRouteAnswer}
                    onRouteAmount={setRouteAmount}
                    headingId={sectionHeadingId(sectionId)}
                  />
                </Card>
              );
            })}

            {closedSections.length > 0 && (
              <Card tone="sunken">
                <div className="calc-more">
                  <h3 className="calc-more__title">Something else you were paid?</h3>
                  <p className="calc-more__blurb">
                    The situation you picked opened the questions it usually needs. Real
                    situations overlap, so everything else is here too — opening one keeps
                    what you have already entered.
                  </p>
                  <div className="calc-more__actions">
                    {closedSections.map((section) => (
                      <Button
                        key={section.id}
                        variant="secondary"
                        onClick={() => openSection(section.id)}
                      >
                        {section.openLabel}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </section>
        )}
      </div>

      {/* -- 5. The result ------------------------------------------------ */}
      {showIncome && (
        <section
          className="calc-step calc-step--result"
          aria-labelledby={stepHeadingId('result')}
        >
          <h2 className="calc-step__title" id={stepHeadingId('result')} tabIndex={-1}>
            {STEP_LABELS.result}
          </h2>
          {missing.length > 0 && (
            <div className="calc-gaps">
              <p className="calc-gaps__lede">Each of these can be answered from here.</p>
              <ul className="calc-gaps__list">
                {missing.map((item) => {
                  const focusId = item.focusId;
                  return focusId === undefined ? (
                    <li key={item.key}>{item.what}</li>
                  ) : (
                    <li key={item.key}>
                      <Button
                        variant="quiet"
                        onClick={() => {
                          setGapsRequested(true);
                          setPendingFocusId(focusId);
                        }}
                      >
                        {item.what}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {computation === null ? (
            <p className="calc-result__waiting">Working it out…</p>
          ) : (
            <ResultStep
              computation={computation}
              taxYear={taxYear}
              stale={state.unreadableFields.length > 0}
            />
          )}
        </section>
      )}
    </div>
  );
}

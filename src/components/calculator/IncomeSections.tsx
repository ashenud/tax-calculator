/**
 * The question groups: employment, work for yourself, investment, capital
 * gains, terminal benefits, and tax already paid.
 *
 * ---------------------------------------------------------------------------
 * WHAT DECIDES WHAT IS ON SCREEN
 * ---------------------------------------------------------------------------
 *
 * `visibleSections()` in `model.ts`, never this file. The persona opens a
 * default set; the user can open any other; and a section holding a figure is
 * always shown. Nothing here can trap a user in the persona they picked.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE EXTRA QUESTIONS ATTACH
 * ---------------------------------------------------------------------------
 *
 * Three questions hang off a money field rather than standing alone, and each
 * attaches by **what the field is**, not by its id:
 *
 *   - a field whose income carries a tag a rate cap applies to gets that cap's
 *     condition questions, from the data (`ConditionQuestions`)
 *   - a field tagged `terminal-benefit` gets the length-of-service question,
 *     because the Act selects the table from it and there is no safe default
 *   - a field carrying foreign tax gets the date it was paid, because whether
 *     credit is allowed at all turns on when it was paid
 *
 * So a future field carrying the same tag picks the same questions up without
 * anything here being edited.
 *
 * ---------------------------------------------------------------------------
 * MONEY
 * ---------------------------------------------------------------------------
 *
 * Every amount is a `CurrencyField`: `inputmode="numeric"`, never
 * `type="number"`, integer rupees out, `null` for not entered. The two
 * non-money answers — a whole number of years and a date — are `TextField`s and
 * are validated on blur by their own rules. No field on this page is a
 * `type="number"` input; a stray scroll over one silently changes a figure
 * somebody is going to declare to the IRD.
 */

import { useState } from 'react';
import { CurrencyField, TextField } from '../ui/index.ts';
import { ConditionQuestions } from './ConditionQuestions.tsx';
import {
  TEXT_FIELD_MESSAGES,
  isRealIsoDate,
  moneyFieldElementId,
  parseServiceYears,
  textFieldElementId,
  type CalculatorState,
  type ConditionQuestion,
  type MoneyField,
  type MoneyFieldId,
  type SectionDefinition,
  type TextFieldId,
} from './model.ts';
import type { SourceEntry } from '../../lib/tax/schema.ts';
import './calculator.css';

export interface IncomeSectionProps {
  section: SectionDefinition;
  /** The fields of this section that are asked for the chosen year. */
  fields: readonly MoneyField[];
  state: CalculatorState;
  /** Conditions to ask against any capped income field in this section. */
  conditionQuestions: readonly ConditionQuestion[];
  /** Field ids that carry a tag a rate cap applies to. */
  cappedFieldIds: readonly MoneyFieldId[];
  sources: Readonly<Record<string, SourceEntry>>;
  /** True once the user has asked for a figure, so gaps become errors. */
  showGapsAsErrors: boolean;
  onAmountChange: (id: MoneyFieldId, value: number | null) => void;
  onAmountValidity: (id: MoneyFieldId, valid: boolean) => void;
  onTextChange: (id: TextFieldId, value: string) => void;
  onConditionAnswer: (
    fieldId: MoneyFieldId,
    conditionId: string,
    answer: boolean,
  ) => void;
  headingId: string;
}

export function IncomeSection({
  section,
  fields,
  state,
  conditionQuestions,
  cappedFieldIds,
  sources,
  showGapsAsErrors,
  onAmountChange,
  onAmountValidity,
  onTextChange,
  onConditionAnswer,
  headingId,
}: IncomeSectionProps) {
  if (fields.length === 0) return null;

  return (
    <section
      className="calc-section"
      aria-labelledby={headingId}
      data-section={section.id}
    >
      {/* A real h3 under the page's h2 for the income step: no level is
          skipped, so the document outline is navigable. */}
      <h3 className="calc-section__title" id={headingId} tabIndex={-1}>
        {section.title}
      </h3>
      <p className="calc-section__blurb">{section.blurb}</p>

      <div className="calc-section__fields">
        {fields.map((field) => (
          <div className="calc-field" key={field.id}>
            <CurrencyField
              id={moneyFieldElementId(field.id)}
              label={field.label}
              hint={field.hint}
              optional={field.optional ?? false}
              value={state.amounts[field.id] ?? null}
              onChange={(value) => onAmountChange(field.id, value)}
              onValidityChange={({ valid }) => onAmountValidity(field.id, valid)}
            />

            {/* The date the overseas tax was paid — asked only once there is a
                figure for it to be about. */}
            {field.destination.kind === 'foreign-tax' &&
              (state.amounts[field.id] ?? null) !== null && (
                <TextFieldFor
                  id="foreign-tax-paid-on"
                  label="The date that overseas tax was paid"
                  hint="Written as year-month-day, for example 2026-07-15. Whether credit is allowed for it turns on when it was paid, so it cannot be assumed."
                  value={state.text['foreign-tax-paid-on'] ?? ''}
                  onChange={onTextChange}
                  invalid={(value) => value.trim() !== '' && !isRealIsoDate(value)}
                  requiredNow={showGapsAsErrors}
                  message={TEXT_FIELD_MESSAGES.paidOn}
                  inputMode="text"
                />
              )}

            {/* Length of service — required by the Act's own table selection
                whenever a leaving payment has been entered. */}
            {field.destination.kind === 'income' &&
              field.destination.tags?.includes('terminal-benefit') && (
                <TextFieldFor
                  id="service-years"
                  label="How many whole years you worked there"
                  hint="A whole number of years, such as 19. The law taxes a leaving payment on one of two tables and chooses between them by this number, so there is no safe answer to leave out."
                  value={state.text['service-years'] ?? ''}
                  onChange={onTextChange}
                  invalid={(value) =>
                    value.trim() !== '' && parseServiceYears(value) === null
                  }
                  requiredNow={
                    showGapsAsErrors && (state.amounts[field.id] ?? null) !== null
                  }
                  message={TEXT_FIELD_MESSAGES.serviceYears}
                />
              )}

            {/* Condition questions, straight from the year's data. */}
            {cappedFieldIds.includes(field.id) && (
              <ConditionQuestions
                fieldId={field.id}
                questions={conditionQuestions}
                incomeLabel={field.label}
                answers={state.conditionAnswers[field.id]}
                onAnswer={(conditionId, answer) =>
                  onConditionAnswer(field.id, conditionId, answer)
                }
                sources={sources}
                showUnansweredAsError={showGapsAsErrors}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * A `TextField` that shows its message once the entry is unreadable, or once
 * the user has asked for a figure and the answer is still missing.
 *
 * Validation runs on blur, not on keystroke: telling somebody halfway through
 * typing "2026-07" that their date is wrong is hostile, and the audience for
 * this tool is already anxious.
 */
function TextFieldFor({
  id,
  label,
  hint,
  value,
  onChange,
  invalid,
  requiredNow,
  message,
  inputMode = 'numeric',
}: {
  id: TextFieldId;
  label: string;
  hint: string;
  value: string;
  onChange: (id: TextFieldId, value: string) => void;
  invalid: (value: string) => boolean;
  requiredNow: boolean;
  message: string;
  inputMode?: 'numeric' | 'text';
}) {
  // Set on blur, so an entry that is unreadable *so far* is not called wrong
  // while it is still being typed [`docs/spec/ui-behaviour.md`, Validation].
  const [blurred, setBlurred] = useState(false);

  const unreadable = blurred && invalid(value);
  // A gap the user has been told about is different: they have asked for a
  // figure and this is what is standing in the way, so it is said whether or
  // not they have visited the field.
  const emptyButNeeded = requiredNow && value.trim() === '';

  return (
    <TextField
      id={textFieldElementId(id)}
      label={label}
      hint={hint}
      numeric
      inputMode={inputMode}
      value={value}
      onChange={(next) => onChange(id, next)}
      onBlur={() => setBlurred(true)}
      error={unreadable || emptyButNeeded ? message : null}
    />
  );
}

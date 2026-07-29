/**
 * The condition questions, rendered from `taxYear.conditions`.
 *
 * ---------------------------------------------------------------------------
 * NOTHING IN THIS FILE KNOWS WHAT ANY CONDITION IS
 * ---------------------------------------------------------------------------
 *
 * There is no condition id in this component, no remittance, no bank, and no
 * `if (conditionId === …)`. It is handed a list produced by
 * `conditionsForCappedIncome()` — which reads the year's own `rateCaps` and
 * `conditions` — and renders each one's `question` as written in the data.
 *
 * That is the promise the data model exists to keep: "when an amendment adds a
 * condition, it appears here without a code change"
 * [`docs/spec/ui-behaviour.md`, CLAUDE.md rule 7]. It is checked directly by
 * `conditions-from-data.test.tsx`, which adds a condition to a copy of the real
 * tax-year data and asserts the new question renders.
 *
 * ---------------------------------------------------------------------------
 * THE SEAM P11 BUILDS ON
 * ---------------------------------------------------------------------------
 *
 * A yes/no is the *generic* rendering, and for one condition it is known to be
 * the wrong shape: "a consultant cannot reliably answer [it], and a wrong
 * answer here swings the liability more than any other input"
 * [`docs/spec/ui-behaviour.md`]. P11 replaces the rendering **for one condition
 * id** with a route picker carrying an amount per route. It does that by
 * passing `renderQuestion`, below — not by this file learning which condition
 * is special. The generic path stays exactly as it is for every other
 * condition, including ones that do not exist yet.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS SHOWN BESIDE THE QUESTION
 * ---------------------------------------------------------------------------
 *
 * The condition's own `evidence` note and a `CitationRef` to its `src`. The
 * question is a legal test being put to a person who will answer it from
 * memory; the provision it comes from is visible text and a real link, never a
 * tooltip [`docs/spec/ui-design-system.md`].
 *
 * STATE MATRIX (`RadioCardGroup` carries them; see that file)
 *
 *   empty     unanswered — no option selected. There is no default, because an
 *             unanswered condition is not a "no": defaulting it either way
 *             silently moves income between the capped rate and the full
 *             ladder. The result stays uncomputed until it is answered.
 *   valid     yes or no chosen.
 *   invalid   `error` on the group, when the user has asked for a figure and
 *             this is what is standing in the way.
 *   disabled  passed through.
 *   focus / hover  the base layer's ring and accent border, on the cards.
 */

import type { ReactNode } from 'react';
import { CitationRef, RadioCardGroup } from '../ui/index.ts';
import {
  CONDITION_ANSWER,
  conditionGroupId,
  type ConditionQuestion,
  type MoneyFieldId,
} from './model.ts';
import type { SourceEntry } from '../../lib/tax/schema.ts';
import './calculator.css';

export interface ConditionQuestionsProps {
  /** From `conditionsForCappedIncome(taxYear)`. Never hand-written. */
  questions: readonly ConditionQuestion[];
  /** The income field these conditions are being asked about. */
  incomeLabel: string;
  /** That field's id, so each question's control id is derivable. */
  fieldId: MoneyFieldId;
  /** Answers so far, by condition id. `undefined` is unanswered. */
  answers: Readonly<Record<string, boolean>> | undefined;
  onAnswer: (conditionId: string, answer: boolean) => void;
  /** The year's `sources` map, so each citation resolves to a real title. */
  sources: Readonly<Record<string, SourceEntry>>;
  /** Set once the user has asked for a figure and this is what is missing. */
  showUnansweredAsError?: boolean;
  /**
   * P11's seam. Return `null` to fall through to the generic yes/no; return an
   * element to replace it entirely for that one condition.
   */
  renderQuestion?: (question: ConditionQuestion) => ReactNode | null;
}

export function ConditionQuestions({
  questions,
  incomeLabel,
  fieldId,
  answers,
  onAnswer,
  sources,
  showUnansweredAsError = false,
  renderQuestion,
}: ConditionQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="calc-conditions">
      <p className="calc-conditions__lede">
        The law charges some of this income at a lower maximum rate only where a condition
        is met, so what you owe on <strong>{incomeLabel.toLowerCase()}</strong> turns on
        the answer below.
      </p>

      {questions.map((question) => {
        const replacement = renderQuestion?.(question);
        if (replacement) {
          return (
            <div className="calc-condition" key={question.id}>
              {replacement}
            </div>
          );
        }

        const answer = answers?.[question.id];
        const unanswered = answer === undefined;

        return (
          <div className="calc-condition" key={question.id}>
            <RadioCardGroup
              id={conditionGroupId(fieldId, question.id)}
              // Verbatim from the data file. Not paraphrased here, because a
              // paraphrase of a statutory test is a second version of it.
              legend={question.condition.question}
              value={
                answer === undefined
                  ? null
                  : answer
                    ? CONDITION_ANSWER.yes
                    : CONDITION_ANSWER.no
              }
              onValueChange={(value) =>
                onAnswer(question.id, value === CONDITION_ANSWER.yes)
              }
              options={[
                { value: CONDITION_ANSWER.yes, label: 'Yes' },
                { value: CONDITION_ANSWER.no, label: 'No' },
              ]}
              error={
                showUnansweredAsError && unanswered
                  ? 'Answer this before a figure can be worked out. Leaving it blank is not the same as answering no, and guessing at it either way would change what you owe.'
                  : null
              }
            />

            <p className="calc-condition__evidence">
              <span className="calc-condition__evidence-label">
                What the law says about proving this:{' '}
              </span>
              {question.condition.evidence}
            </p>

            <p className="calc-condition__citation">
              <CitationRef
                src={question.condition.src}
                sources={sources}
                label="Condition from"
              />
            </p>
          </div>
        );
      })}
    </div>
  );
}

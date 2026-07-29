/**
 * What the calculator shows once it has been given enough to work on.
 *
 * ---------------------------------------------------------------------------
 * SCOPE — THIS IS NOT THE RESULT PANEL
 * ---------------------------------------------------------------------------
 *
 * P12 builds the result panel: the working, every rate with its citation, the
 * payment schedule, the mobile summary bar. This prompt's job stops at wiring
 * `computeTax` up and showing *that* a result was reached, so what is below the
 * figure here is a single line and a notice saying the working is not on the
 * page yet.
 *
 * That notice is not a placeholder for a designer to delete. "A dashboard
 * presenting a total without the working" is prohibited
 * [`docs/spec/ui-design-system.md`], and until P12 lands this page is exactly
 * that. Saying so out loud is the honest way to be in this state; quietly
 * shipping a bare total is not. P12 removes the notice by removing the reason
 * for it.
 *
 * ---------------------------------------------------------------------------
 * THE ORDER, AND WHO GUARANTEES IT
 * ---------------------------------------------------------------------------
 *
 * `RefusalPanel` does — refusals, then warnings, then the figure, as DOM order
 * rather than as CSS, with the figure produced by a callback it only calls when
 * the result is not a refusal. This component cannot render a figure beside a
 * refusal even by mistake, because the branded type the figure needs is only
 * obtainable inside that callback.
 *
 * ---------------------------------------------------------------------------
 * THE THREE STATES THAT SHOW NO FIGURE, AND WHY NONE OF THEM SHOWS `Rs. 0`
 * ---------------------------------------------------------------------------
 *
 *   incomplete    Questions are still unanswered. `Rs. 0` here would tell
 *                 somebody a computation happened when it did not.
 *   uncomputable  The engine declined this combination. Its own message is
 *                 shown verbatim. No amount anywhere.
 *   refused       `RefusalPanel` replaces the figure entirely [ADR-0003].
 */

import { AsAtStamp } from './AsAtStamp.tsx';
import type { Computation } from './compute.ts';
import { Callout, Card, RefusalPanel, formatRupeesWithUnit } from '../ui/index.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './calculator.css';

export interface ResultStepProps {
  computation: Computation;
  /** The year the computation was run for. `null` before one is chosen. */
  taxYear: TaxYearFile | null;
  /**
   * True while some field's entry cannot be read. The figure shown is the last
   * one computed from readable entries, and is marked stale rather than blanked
   * — a user has not deleted a figure by mistyping over it
   * [`docs/spec/ui-behaviour.md`, invalid state].
   */
  stale?: boolean;
}

export function ResultStep({ computation, taxYear, stale = false }: ResultStepProps) {
  if (computation.status === 'incomplete') {
    return (
      <Card title="Nothing has been worked out yet" headingLevel={3}>
        <p>
          No figure is shown because none has been computed — not because the answer is
          nil. Still to answer:
        </p>
        <ul className="calc-missing">
          {computation.missing.map((item) => (
            <li key={item.key}>{item.what}</li>
          ))}
        </ul>
      </Card>
    );
  }

  if (computation.status === 'uncomputable') {
    return (
      // `role="alert"`, as a refusal is: this replaces a figure the user was
      // expecting, and it appears in response to something they just did.
      <div className="calc-uncomputable" role="alert">
        <Callout
          tone="danger"
          title="We are not going to guess at your tax"
          headingLevel={3}
        >
          <p>
            The figures you have entered land on a point that the law, or this project’s
            record of it, does not settle. No amount has been worked out, and none is
            shown below. This is not something you have got wrong.
          </p>
          {/* Verbatim from the engine: it names the exact combination and the
              provision behind it. A paraphrase would be a second version of a
              rule that already has one. */}
          <p className="calc-uncomputable__detail">{computation.detail}</p>
          <p>
            Take what you have entered to the Inland Revenue Department, or to a qualified
            tax practitioner who can reason about it with you.
          </p>
        </Callout>
      </div>
    );
  }

  const { result } = computation;

  return (
    <RefusalPanel result={result} headingLevel={3}>
      {(computed) => (
        <>
          {/* Above the figure, deliberately. A caveat under a number is a
              caveat most people scroll past. */}
          <Callout
            tone="caution"
            title="You cannot check this figure on this page yet"
            headingLevel={3}
          >
            <p>
              The step-by-step working, the rate behind each step with the provision it
              comes from, and the payment dates are not built yet. Until they are, this
              number is not something you can check, and it is not something to file on.
              Verify it with the Inland Revenue Department or a qualified tax practitioner
              before you rely on it.
            </p>
          </Callout>

          <Card
            title="Tax payable on what you have entered"
            headingLevel={3}
            emphasis
            titleAside={
              taxYear ? (
                <AsAtStamp
                  yearOfAssessment={computed.yearOfAssessment}
                  dataReviewedOn={taxYear.lastReviewed}
                />
              ) : null
            }
          >
            {stale && (
              <p className="calc-figure__stale">
                One of the amounts above cannot be read at the moment. This figure is the
                last one worked out from entries that could be, so it is out of date with
                what is on screen.
              </p>
            )}

            {/* Never animated, never counted up [ADR-0003]. It is text. */}
            <p className="calc-figure figure" data-stale={stale ? '' : undefined}>
              {formatRupeesWithUnit(computed.taxPayable)}
            </p>

            <p className="calc-figure__caption">
              For year of assessment {computed.yearOfAssessment}, on the figures you
              entered and the law as this project records it for that year.
            </p>
          </Card>
        </>
      )}
    </RefusalPanel>
  );
}

/**
 * What the calculator shows once it has been given enough to work on.
 *
 * ---------------------------------------------------------------------------
 * THE ORDER, AND WHO GUARANTEES IT
 * ---------------------------------------------------------------------------
 *
 * Top to bottom, normatively [`docs/spec/ui-behaviour.md` §4]: refusals,
 * warnings, the figure, the working, the payment schedule, what to do next.
 *
 * `RefusalPanel` guarantees the first three as DOM order, not CSS, and the
 * figure is produced by a callback it calls only on the non-refused path — see
 * that file's own header. Everything from "the working" down is added here,
 * *inside* that same callback, so a refusal that replaces the figure also
 * replaces the working, the schedule and the next-steps section: none of them
 * can render without a `ComputedTaxResult`, because none of them exist outside
 * the callback that produces one.
 *
 * `ResultStep.test.tsx` asserts the full order — refusal/warnings/figure/
 * working/schedule/next-steps — the same way `RefusalPanel.test.tsx` asserts
 * its own three: `compareDocumentPosition` against a DOM with no stylesheet
 * loaded, which is "verified with CSS disabled" in the strongest sense jsdom
 * can offer.
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
 *
 * ---------------------------------------------------------------------------
 * THE MOBILE SUMMARY BAR
 * ---------------------------------------------------------------------------
 *
 * Above 1024px the result panel is a sticky column beside the inputs
 * (`calculator.css`, `.calc-step--result`); below it, the panel sits at the
 * bottom of a single-column page and can be scrolled well out of view. The
 * summary bar is what stays on screen regardless — the current figure (or the
 * words for "nothing yet" / "no figure"), a jump to the full panel, and,
 * because it is explicitly the one thing `ui-behaviour.md` says must not be
 * lost, **a blocking-warning indicator**. It is not a second live region: it
 * carries no `aria-live` of its own, because `RefusalPanel`'s region is the
 * single announced source of truth and a second one would announce the same
 * figure twice [`TaxCalculator.tsx`].
 */

import { AsAtStamp } from './AsAtStamp.tsx';
import type { Computation } from './compute.ts';
import { PaymentSchedule } from './PaymentSchedule.tsx';
import { WhatNext } from './WhatNext.tsx';
import { WorkingTable } from './WorkingTable.tsx';
import {
  Callout,
  Card,
  IconOctagonAlert,
  RefusalPanel,
  SEVERITY_LABEL,
  formatRupeesWithUnit,
} from '../ui/index.ts';
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
  return (
    <>
      <ResultBody computation={computation} taxYear={taxYear} stale={stale} />
      <MobileSummaryBar computation={computation} />
    </>
  );
}

function ResultBody({ computation, taxYear, stale }: Required<ResultStepProps>) {
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

          {/*
            The working, the schedule, what to do next — all three exist only
            inside this callback, so none of them can render on a refusal.
            `taxYear` is non-null here: `compute()` never reaches `computed`
            status without one (see `compute.ts`), so the branch below is
            unreachable rather than a real gap — but the prop stays nullable
            because every other state in this component is reachable without a
            year chosen at all, and narrowing it just for this one branch is
            not worth a second copy of the type.
          */}
          {taxYear && (
            <>
              <WorkingTable result={computed} taxYear={taxYear} />
              <PaymentSchedule result={computed} taxYear={taxYear} />
              <WhatNext taxYear={taxYear} />
            </>
          )}
        </>
      )}
    </RefusalPanel>
  );
}

/* ========================================================================= */

type SummaryState =
  | { kind: 'none' }
  | { kind: 'blocked'; blocking: boolean }
  | { kind: 'ready'; text: string; blocking: boolean };

function summaryStateFor(computation: Computation): SummaryState {
  if (computation.status === 'incomplete') return { kind: 'none' };
  if (computation.status === 'uncomputable') return { kind: 'blocked', blocking: true };

  const { result } = computation;
  const blocking = result.warnings.some((warning) => warning.severity === 'blocking');
  if (result.refusals.length > 0) return { kind: 'blocked', blocking: true };
  return { kind: 'ready', text: formatRupeesWithUnit(result.taxPayable), blocking };
}

function MobileSummaryBar({ computation }: { computation: Computation }) {
  const state = summaryStateFor(computation);

  return (
    <div className="calc-summary-bar">
      <span className="calc-summary-bar__figure figure">
        {state.kind === 'none' && 'Nothing worked out yet'}
        {state.kind === 'blocked' && 'No figure — see why below'}
        {state.kind === 'ready' && state.text}
      </span>

      {state.kind !== 'none' && 'blocking' in state && state.blocking && (
        <span className="calc-summary-bar__blocking">
          <IconOctagonAlert className="calc-summary-bar__blocking-icon" />
          {SEVERITY_LABEL.blocking}
        </span>
      )}

      <a className="calc-summary-bar__link" href="#calc-step-result">
        See working
      </a>
    </div>
  );
}

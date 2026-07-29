/**
 * The gate between a `TaxResult` and anything that renders a figure from it.
 *
 * ADR-0003 decisions 3 and 5, and the normative page order in
 * `docs/spec/ui-behaviour.md` §4, are both enforced *here* rather than being
 * left as instructions a later component is trusted to follow:
 *
 *     1. refusals, if any — replacing the figure entirely
 *     2. warnings, expanded
 *     3. the figure
 *
 * That order is this component's DOM order, unconditionally. It is not produced
 * by CSS — `flex-direction`, `order` and `grid-area` are all absent — so it
 * survives a stylesheet that fails to load, a print stylesheet, a reader mode
 * and a screen reader reading the document in source order.
 * `RefusalPanel.test.tsx` asserts it with `compareDocumentPosition`, in jsdom,
 * where no stylesheet is applied at all.
 *
 * ---------------------------------------------------------------------------
 * WHY `children` IS A FUNCTION
 * ---------------------------------------------------------------------------
 *
 * `isRefusal(result)` is the supported test for "no figure was produced", and
 * when it is true `grossTax`, `taxPayable`, `credits` and `schedule` are zeroed
 * placeholders — not an answer, and not "zero tax". Rendering them is a defect
 * (see the contract on `TaxResult`).
 *
 * A caller who has to remember to check that will one day forget. So the check
 * is not optional here: the figure is produced by a callback that this component
 * calls **only** on the non-refused path, and the callback is handed a
 * `ComputedTaxResult` — a `TaxResult` branded as proven not to be a refusal.
 * Nothing else in the codebase produces that brand. A component whose props say
 * `result: ComputedTaxResult` therefore *cannot* be passed a raw `TaxResult` at
 * all; it can only be reached from inside this callback. That is a compile-time
 * guarantee, not a convention, and it is what "a caller cannot accidentally
 * render both" means in practice.
 *
 * ---------------------------------------------------------------------------
 * WHAT A REFUSAL RENDERS
 * ---------------------------------------------------------------------------
 *
 * No rupee amount, no rate, no date, no schedule, no as-at stamp — an as-at
 * stamp beside a refusal would suggest something was computed as at that date.
 * The year of assessment *is* stated, in words, because a refusal is still
 * scoped to a year and a screenshot of it must say which [CLAUDE.md rule 5].
 *
 * `role="alert"` per `docs/spec/ui-behaviour.md` ("refusals are `role="alert"`").
 * Caveat worth knowing: assistive technology announces an alert that *appears*;
 * one already present at first paint may not be announced. It is a visible,
 * unmissable, uncollapsible panel first and an announcement second.
 */

import type { ReactNode } from 'react';
import { Callout } from './Callout.tsx';
import { WarningList } from './WarningList.tsx';
import { isRefusal, type ResultRefusal, type TaxResult } from '../../lib/tax/engine.ts';
import './ui.css';

// ---------------------------------------------------------------------------
// The brand
// ---------------------------------------------------------------------------

/** Type-only. Erased at runtime; there is no such property on any object. */
declare const NOT_A_REFUSAL: unique symbol;

/**
 * A `TaxResult` that has been proven to carry a figure.
 *
 * Obtainable only from `RefusalPanel`'s `children` callback. Give this type to
 * every prop that renders a figure — a result panel, a working table, a payment
 * schedule — and the "did you check for a refusal?" review question disappears,
 * because the answer is in the type.
 */
export type ComputedTaxResult = TaxResult & { readonly [NOT_A_REFUSAL]: true };

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Refusal codes raised by the UI layer rather than by the engine.
 *
 * The engine has exactly one refusal (`REFUSAL_CODES.mixedCappedAndUncapped`,
 * Q14). The remittance route picker in P11 produces a second: a user whose
 * foreign earnings arrived by a mixture of routes (Q11). Whether the reduced
 * treatment then applies per payment, proportionately, or not at all is not
 * settled, and `docs/spec/ui-behaviour.md` requires the mixture case be refused
 * rather than decided. The code is fixed here so P11 cannot coin a variant.
 */
export const UI_REFUSAL_CODES = {
  partialRemittanceMixture: 'partial-remittance-mixture',
} as const;

export interface RefusalCopy {
  title: string;
  /** What is unresolved, in the user's own terms. */
  meaning: string;
  /** What would settle it. Named, so the refusal is not a dead end. */
  whatWouldSettleIt: string;
}

const REFUSAL_COPY: Readonly<Record<string, RefusalCopy>> = {
  'mixed-capped-and-uncapped-ordering': {
    title: 'We are not going to guess at your tax',
    meaning:
      'You have income of two kinds in the same year: some that the law charges at a reduced maximum rate, and some that it does not. When the two are added together the law does not say which of them is taxed first — and the two orders produce materially different amounts of tax. There is no reading we can pick that would not be a guess presented to you as an answer, so no figure has been computed.',
    whatWouldSettleIt:
      'The Inland Revenue Department’s return form for this year of assessment is the most likely thing to settle it. Until then this is a question for a qualified tax practitioner, who can take the income you entered above and reason about it with you.',
  },
  [UI_REFUSAL_CODES.partialRemittanceMixture]: {
    title: 'We are not going to guess at your tax',
    meaning:
      'You told us your foreign earnings reached you by more than one route — some of it came into Sri Lanka and some of it did not. The law does not say whether the reduced treatment then applies to the part that came in, to all of it, or to none of it. Each reading gives a different answer, and the difference is large, so no figure has been computed.',
    whatWouldSettleIt:
      'Guidance from the Inland Revenue Department, or the return form for this year of assessment, would settle it. Until then, take the amounts and the routes you entered to a qualified tax practitioner.',
  },
};

const UNKNOWN_REFUSAL_COPY: RefusalCopy = {
  title: 'We are not going to guess at your tax',
  meaning:
    'The law is not clear for your situation, so no figure has been computed. The exact point that is unresolved is set out below, in the words the calculation produced.',
  whatWouldSettleIt:
    'Take what you entered above to the Inland Revenue Department or to a qualified tax practitioner.',
};

/** Never undefined — an unrecognised code still renders, on its own explanation. */
export function refusalCopy(code: string): RefusalCopy {
  return REFUSAL_COPY[code] ?? UNKNOWN_REFUSAL_COPY;
}

/** True when this build has wording of its own for `code`. Test-facing. */
export function hasRefusalCopy(code: string): boolean {
  return code in REFUSAL_COPY;
}

// ---------------------------------------------------------------------------
// The component
// ---------------------------------------------------------------------------

export interface RefusalPanelProps {
  /** The whole result, refused or not. Never pre-inspected by the caller. */
  result: TaxResult;
  /**
   * The figure and its working. Called **only** when the result is not a
   * refusal, and always rendered after the refusals and warnings above it.
   */
  children: (result: ComputedTaxResult) => ReactNode;
  /** Heading level for the refusal and the warning list. Defaults to 2. */
  headingLevel?: 2 | 3 | 4;
  id?: string;
}

function RefusalItem({
  refusal,
  headingLevel,
  yearOfAssessment,
}: {
  refusal: ResultRefusal;
  headingLevel: 2 | 3 | 4;
  yearOfAssessment: string;
}) {
  const copy = refusalCopy(refusal.code);

  return (
    <Callout
      tone="danger"
      title={copy.title}
      headingLevel={headingLevel}
      footer={
        <p className="ui-refusal__code">
          Reference: <code>{refusal.code}</code>
          {refusal.question ? (
            <>
              {' · open question '}
              <code>{refusal.question}</code>
              {' in this project’s research register'}
            </>
          ) : null}
        </p>
      }
    >
      <p className="ui-refusal__lede">
        No figure has been computed for year of assessment {yearOfAssessment}.
      </p>
      <p>{copy.meaning}</p>
      {/* From `TaxResult` verbatim: it carries the provisions and the citation. */}
      <p className="ui-refusal__detail">{refusal.explanation}</p>
      <p>{copy.whatWouldSettleIt}</p>
    </Callout>
  );
}

export function RefusalPanel({
  result,
  children,
  headingLevel = 2,
  id,
}: RefusalPanelProps) {
  const refused = isRefusal(result);

  return (
    <div className="ui-result-region" id={id}>
      {/* 1. Refusals — first, and they replace the figure entirely. */}
      {refused && (
        <div className="ui-refusal" role="alert">
          {result.refusals.map((refusal, index) => (
            <RefusalItem
              key={`${refusal.code}-${index}`}
              refusal={refusal}
              headingLevel={headingLevel}
              yearOfAssessment={result.yearOfAssessment}
            />
          ))}
        </div>
      )}

      {/* 2. Warnings — expanded, never collapsed, always above the figure. */}
      <WarningList warnings={result.warnings} headingLevel={headingLevel} />

      {/*
        3. The figure. The live region is in the DOM on every path, including
        the refused one, so it exists before it has anything to say — the same
        reason `.ui-field__error` is always present. On a refusal it is empty:
        no figure anywhere, per ADR-0003 decision 5.
      */}
      <div className="ui-result-region__figure" aria-live="polite">
        {refused ? null : children(result as ComputedTaxResult)}
      </div>
    </div>
  );
}

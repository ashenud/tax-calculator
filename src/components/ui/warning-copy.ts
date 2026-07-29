/**
 * User-facing wording for every warning and refusal the interface can be handed.
 *
 * "The trigger belongs to the engine; the wording belongs here"
 * (`docs/prompts/P09-constrained-components.md`). The engine decides *whether* a
 * warning fires and supplies the figures and the citation in its own `message`;
 * this table decides how the point is put to a person who has never met the term.
 *
 * ---------------------------------------------------------------------------
 * THE TWO CODE SETS DO NOT MATCH, AND BOTH ARE CARRIED HERE
 * ---------------------------------------------------------------------------
 *
 * `docs/spec/ui-behaviour.md` ("Warnings the UI must be able to render") names
 * seven codes. `src/lib/tax/engine.ts` (`WARNING_CODES`) emits ten. They overlap
 * on exactly two — `unverified-rate` and `excess-credit`:
 *
 *   in the spec only        `stale-law`, `condition-not-met`,
 *                           `condition-unresolved`, `proposed-year`,
 *                           `late-instalment`
 *   in both                 `unverified-rate`, `excess-credit`
 *   in the engine only      `component-not-implemented`,
 *                           `rate-cap-not-implemented`,
 *                           `rate-cap-condition-not-met`,
 *                           `qualifying-payment-types-not-modelled`,
 *                           `foreign-credit-capped`,
 *                           `foreign-credit-time-limit`,
 *                           `estimate-exceeds-liability`,
 *                           `final-payment-date-unresolved`
 *
 * Neither set is wrong, and neither is dropped:
 *
 *   - The spec's table is normative for the codes it names, so every one of them
 *     has wording here even where no code in this repository emits it yet. Three
 *     of the five cannot come from the engine at all by design — `late-instalment`
 *     needs today's date, which is the UI's to supply (see the engine's file
 *     header); `proposed-year` and `stale-law` are properties of the tax-year
 *     *file*, not of a computation. `YearSelector` and the P10/P11 island are
 *     where those originate.
 *   - The engine's codes are what a real `TaxResult` actually carries, so they
 *     must never reach a user as a bare hyphenated string.
 *   - `rate-cap-condition-not-met` is the engine's concrete realisation of the
 *     spec's `condition-not-met`; `condition-unresolved` has no engine
 *     counterpart because the unresolved remittance routes (Q13, Q41) are
 *     answered in the UI's route picker, not in the engine.
 *
 * `warningCopy()` never returns undefined. An unrecognised code falls back to
 * generic wording and the engine's own `message` is still rendered verbatim, so
 * a code added to the engine without a matching entry here degrades to "less
 * plain English" and never to "silently swallowed".
 *
 * ---------------------------------------------------------------------------
 * WHAT THE WORDING MAY AND MAY NOT SAY
 * ---------------------------------------------------------------------------
 *
 *   - No figures and no rates. Every number a user sees comes from `TaxResult`
 *     [CLAUDE.md rule 1 and the "UI never computes" rule]. `meaning` below
 *     describes what happened to *their* figure; the engine's `message`, printed
 *     directly beneath it, carries the amounts and the citation.
 *   - No instruction to pay or file, and nothing suggesting an arrangement that
 *     would reduce a liability [ADR-0003 decision 6].
 *   - Written for someone doing this for the first time: "tax already taken off
 *     your pay", not "APIT".
 */

import { WARNING_CODES } from '../../lib/tax/engine.ts';
import type { CalloutTone } from './Callout.tsx';

/**
 * Warning codes named by `docs/spec/ui-behaviour.md` that the engine does not
 * emit. They originate in the UI layer, and this is the single place their
 * spelling is fixed so P10–P12 cannot invent a near-miss variant.
 */
export const UI_WARNING_CODES = {
  /** This year's data predates an amendment act the project does not hold. */
  staleLaw: 'stale-law',
  /** A condition for a reduced rate was not met, and why. */
  conditionNotMet: 'condition-not-met',
  /** The law is unclear for the route the user described (Q13, Q41). */
  conditionUnresolved: 'condition-unresolved',
  /** The chosen year of assessment is `status: "proposed"` — not yet law. */
  proposedYear: 'proposed-year',
  /**
   * One or more instalment dates for this year have already passed. Persona p2's
   * whole problem, and `docs/spec/ui-behaviour.md` requires it be prominent
   * rather than a footnote — so it is raised at `blocking` severity by whoever
   * constructs it. The engine cannot: it needs today's date.
   */
  lateInstalment: 'late-instalment',
} as const;

export interface WarningCopy {
  /** The heading. A short sentence, not a category name. */
  title: string;
  /** What it means for the figure this person is about to read. */
  meaning: string;
}

/**
 * Wording for the ten codes in `WARNING_CODES` and the five in
 * `UI_WARNING_CODES`. Keyed by the code string rather than by the const's key,
 * because the string is what travels inside a `ResultWarning`.
 */
const WARNING_COPY: Readonly<Record<string, WarningCopy>> = {
  // --- named by docs/spec/ui-behaviour.md, emitted by the engine -----------
  [WARNING_CODES.unverifiedRate]: {
    title: 'A rate used here has not been confirmed against the law itself',
    meaning:
      'One of the rates behind this figure is recorded in this project as not yet checked against the Act. The figure is provisional. Check it with the Inland Revenue Department or a qualified tax practitioner before you rely on it.',
  },
  [WARNING_CODES.excessCredit]: {
    title: 'More tax has already been collected from you than this computation makes due',
    meaning:
      'Nothing further is payable on these figures. What happens to the difference — whether it comes back to you or is carried forward — is not settled by the sources this project holds, so no treatment of it has been assumed. Take it to the Inland Revenue Department or a qualified tax practitioner.',
  },

  // --- named by docs/spec/ui-behaviour.md, raised by the UI layer ----------
  [UI_WARNING_CODES.staleLaw]: {
    title: 'This year’s recorded data may not include a later change in the law',
    meaning:
      'The data behind this year of assessment was compiled from the documents this project holds, and a later amendment may have changed something used here. Confirm the position before you rely on the figure.',
  },
  [UI_WARNING_CODES.conditionNotMet]: {
    title: 'A condition for the reduced treatment was not met',
    meaning:
      'On the answers you gave, a condition the law attaches to the reduced treatment was not met, so it was not applied and the ordinary rates were used instead. The detail below says which condition, and where it comes from.',
  },
  [UI_WARNING_CODES.conditionUnresolved]: {
    title: 'The law is not clear for the way your money reached you',
    meaning:
      'The law does not clearly say how this case is treated. We are not going to guess at your tax. The figure shown assumes nothing about this point, and the detail below names what would settle it. Take this to the Inland Revenue Department or a qualified tax practitioner.',
  },
  [UI_WARNING_CODES.proposedYear]: {
    title: 'These figures are not yet law',
    meaning:
      'The year of assessment you chose is recorded as proposed. Its rates come from a proposal that has not been enacted, so they may change before they apply, and anything computed from them may change with them.',
  },
  [UI_WARNING_CODES.lateInstalment]: {
    title: 'One or more instalment dates for this year have already passed',
    meaning:
      'A payment date shown in the schedule below is in the past. Paying late can attract a charge that this tool does not compute, and an employer not deducting tax does not remove the obligation from you. Speak to the Inland Revenue Department or a qualified tax practitioner about a date that has been missed.',
  },

  // --- emitted by the engine, not named by the spec's table ----------------
  [WARNING_CODES.componentNotImplemented]: {
    title: 'Part of your income has no rate in this year’s recorded data',
    meaning:
      'That part of your income has been charged nothing at all, because this project holds no rate for it and will not supply one from memory. The figure shown is therefore incomplete and lower than the true liability. Do not rely on it.',
  },
  [WARNING_CODES.rateCapNotImplemented]: {
    title: 'The reduced maximum rate is not in this year’s recorded data',
    meaning:
      'Income you said was earned in foreign currency has been charged at the ordinary rates, because this project holds no maximum-rate entry for this year. If a maximum rate does apply for this year, the figure shown is higher than the true liability.',
  },
  [WARNING_CODES.rateCapConditionNotMet]: {
    title: 'The maximum rate did not apply to some of your foreign-currency income',
    meaning:
      'On the answers you gave, a condition the law attaches to the maximum rate was not met for part of that income, so the ordinary rates were used for it. There is no reduced fallback. The detail below says which condition and how much income it affected.',
  },
  [WARNING_CODES.qualifyingPaymentTypes]: {
    title: 'Qualifying payments were taken exactly as you entered them',
    meaning:
      'This year’s data lists types of qualifying payment, but how each type’s own limit works is not recorded here, so the amount you entered was deducted as given and was not checked against a limit. If you are unsure how much is allowable, that is a question for a qualified tax practitioner.',
  },
  [WARNING_CODES.foreignCreditCapped]: {
    title: 'Not all of the tax you paid abroad has been credited here',
    meaning:
      'Credit for tax paid in another country has been limited, so part of what you paid abroad is not set against your Sri Lankan tax in this computation. The detail below gives both amounts and the provision that limits it.',
  },
  [WARNING_CODES.foreignCreditTimeLimit]: {
    title: 'No credit has been given for tax you paid abroad',
    meaning:
      'On the payment date you entered, the tax paid abroad falls outside the period in which credit can be given, so none has been allowed and the tax payable is higher than it would otherwise be. If you think the date is wrong, correct it. If it is right, this is worth raising with a qualified tax practitioner.',
  },
  [WARNING_CODES.estimateExceedsLiability]: {
    title: 'Your instalments come to more than this computation makes payable',
    meaning:
      'The instalments below are worked out from the estimate you entered, and they add up to more than the tax computed — so the final line is an overpayment rather than a balance due. Whether an overpayment comes back to you or is carried forward is not settled by the sources this project holds.',
  },
  [WARNING_CODES.finalPaymentDateUnresolved]: {
    title: 'No date is shown for the balance still payable',
    meaning:
      'A balance remains after the instalments, and this tool shows no date for it: whether a separate deadline exists for the balance is not established by the sources this project holds, so none has been stated. Confirm the date with the Inland Revenue Department or a qualified tax practitioner.',
  },
};

/**
 * Wording for a code this build has never heard of.
 *
 * Deliberately not an error and deliberately not a dropped warning. A warning
 * that vanishes because its code is unfamiliar is the exact failure ADR-0003 is
 * written against, so the engine's own `message` is rendered underneath this and
 * the user sees the substance either way.
 */
export const UNKNOWN_WARNING_COPY: WarningCopy = {
  title: 'Something about this computation needs checking',
  meaning:
    'The calculation raised a point that this page has no plain-language wording for. The exact wording it produced is below. Do not treat the figure as settled until you have understood it.',
};

/** Never undefined. See `UNKNOWN_WARNING_COPY`. */
export function warningCopy(code: string): WarningCopy {
  return WARNING_COPY[code] ?? UNKNOWN_WARNING_COPY;
}

/** True when this build has wording of its own for `code`. Test-facing. */
export function hasWarningCopy(code: string): boolean {
  return code in WARNING_COPY;
}

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

/**
 * Severity is carried by three signals, never by colour: the tone's own icon
 * *shape* (octagon / triangle / circle — see `icons.tsx`), the visible label
 * below, and the heading colour. A user who cannot see the colours reads the
 * shape and the words; a user reading with a screen reader gets the words.
 */
export const SEVERITY_LABEL: Readonly<Record<'info' | 'warn' | 'blocking', string>> = {
  blocking: 'Do not rely on the figure',
  warn: 'Check this before you file',
  info: 'For information',
};

export const SEVERITY_TONE: Readonly<Record<'info' | 'warn' | 'blocking', CalloutTone>> =
  {
    blocking: 'danger',
    warn: 'caution',
    info: 'info',
  };

/**
 * Sort order within the warning list: blocking first, then `warn`, then `info`.
 *
 * Only *within* the list. The list itself never moves below the figure
 * [ADR-0003 decision 3]. Sorting is stable, so the engine's own order is kept
 * inside each severity — the engine emits in pipeline order, which is the order
 * a reader following the working expects.
 */
export const SEVERITY_RANK: Readonly<Record<string, number>> = {
  blocking: 0,
  warn: 1,
  info: 2,
};

/**
 * The question this project exists for.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NOT A YES/NO
 * ---------------------------------------------------------------------------
 *
 * The condition is "received in foreign currency **and** remitted through a
 * bank to Sri Lanka" [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. Rendered
 * naively that is a yes/no — and the person answering it is a consultant who
 * knows that some months the money came through her bank and some months it sat
 * in a Wise balance [`docs/personas/p1-wfh-foreign-consultant.md`]. She cannot
 * honestly answer yes or no, and "a wrong answer here swings the liability more
 * than any other input in the tool"
 * [`docs/prompts/P11-remittance-route-picker.md`].
 *
 * So she is asked what actually happened to her money, and the tool does the
 * classifying — which is the general principle of the whole interface:
 * "Statutory categories are the tool's problem to resolve, not the user's"
 * [`docs/spec/ui-behaviour.md`, Principles].
 *
 * ---------------------------------------------------------------------------
 * THREE OF THE FIVE ROUTES ARE NOT DECIDED
 * ---------------------------------------------------------------------------
 *
 *   FX account at a Sri Lankan bank   Q13 — unresolved. Flagged here, the
 *                                     condition left unanswered, no figure.
 *   Wise / Payoneer / PayPal          Q41 — the same.
 *   A mixture of routes               Q11 — the computation is refused
 *                                     outright, in `compute.ts`.
 *
 * "Do not resolve Q11, Q13 or Q41 with a sensible-looking default"
 * [P11]. An unresolved route therefore leaves the underlying condition
 * *unanswered* rather than answering it either way, and the result panel goes
 * on listing it as still to answer. That is not an oversight the user has to
 * clear; it is the tool declining to invent law.
 *
 * The notice for those two routes is `UI_WARNING_CODES.conditionUnresolved`
 * from `warning-copy.ts` — the shared wording for exactly this case, rendered
 * here rather than smuggled into a `TaxResult` as a synthetic warning. It sits
 * where the choice was made, expanded, in a `Callout` that cannot be collapsed
 * or dismissed [ADR-0003].
 *
 * ---------------------------------------------------------------------------
 * NOTHING HERE SUGGESTS A ROUTE
 * ---------------------------------------------------------------------------
 *
 * No route is compared with another, none is described as better, and nothing
 * says what a different arrangement would have produced. Telling somebody to
 * route their payments differently is advice, and this project does not give it
 * [CLAUDE.md rule 6, ADR-0003 decision 6]. `remittance-route.test.tsx` reads
 * the rendered text back and asserts it, which is a smoke check and not a
 * substitute for someone reading it.
 *
 * ---------------------------------------------------------------------------
 * STATE MATRIX
 * ---------------------------------------------------------------------------
 *
 *   empty     no route chosen. Nothing is preselected, and the condition is
 *             unanswered — which is what keeps the result uncomputed.
 *   valid     one route chosen; the notice for that route, if it has one, is
 *             below the group and above everything else.
 *   invalid   `error` on the group once the user has asked for a figure and
 *             this is what is standing in the way.
 *   refused   the mixture route: amount boxes appear, and `compute.ts`
 *             replaces the figure with a refusal.
 *   disabled  not used — this question is never disabled. Disabling the input
 *             that decides the liability would be a silent decision.
 *   focus / hover  the base layer's ring and accent border, from
 *             `RadioCardGroup`.
 */

import { CitationRef, CurrencyField, RadioCardGroup } from '../ui/index.ts';
import { Callout } from '../ui/Callout.tsx';
import { SEVERITY_TONE, UI_WARNING_CODES, warningCopy } from '../ui/warning-copy.ts';
import {
  MIXTURE_ROUTE_ID,
  REMITTANCE_ROUTES,
  SPLIT_ROUTES,
  conditionAnswerForRoute,
  remittanceRoute,
  type RemittanceRoute,
} from './remittance-routes.ts';
import {
  conditionFirstOptionId,
  conditionGroupId,
  type ConditionQuestion,
  type MoneyFieldId,
} from './model.ts';
import type { SourceEntry } from '../../lib/tax/schema.ts';
import './calculator.css';

/** The question put to the person, in their terms. Not the statutory test. */
export const ROUTE_QUESTION = 'How did that money reach you?';

export const ROUTE_HINT =
  'Pick the one that describes what actually happened. This matters more to what you owe than anything else you enter here, and nothing is assumed for you if you leave it blank.';

export const ROUTE_UNANSWERED_ERROR =
  'Choose the one that describes how this money reached you before a figure can be worked out. Leaving it blank is not an answer, and picking one at random would change what you owe.';

/** Where a split amount's input lives, so a label can point at it. */
export function splitFieldElementId(fieldId: MoneyFieldId, routeId: string): string {
  return `calc-${fieldId}-split-${routeId}`;
}

export interface RemittanceRoutePickerProps {
  /** The condition being answered, verbatim from the year's data. */
  question: ConditionQuestion;
  /** The income field these routes are about. */
  fieldId: MoneyFieldId;
  /** The route chosen so far, or `null`. */
  routeId: string | null;
  /** Amounts written against individual routes. Recorded only, never computed. */
  amounts: Readonly<Record<string, number | null>>;
  /**
   * The chosen route, and the condition answer that follows from it — `null`
   * meaning "leave it unanswered", which is a real state and not a gap.
   */
  onRouteChange: (routeId: string, conditionAnswer: boolean | null) => void;
  onAmountChange: (routeId: string, value: number | null) => void;
  /** The year's `sources`, so the condition's citation resolves to a title. */
  sources: Readonly<Record<string, SourceEntry>>;
  /** Set once the user has asked for a figure and this is what is missing. */
  showUnansweredAsError?: boolean;
}

export function RemittanceRoutePicker({
  question,
  fieldId,
  routeId,
  amounts,
  onRouteChange,
  onAmountChange,
  sources,
  showUnansweredAsError = false,
}: RemittanceRoutePickerProps) {
  const chosen = remittanceRoute(routeId);
  const groupId = conditionGroupId(fieldId, question.id);

  return (
    <div className="calc-routes">
      <RadioCardGroup
        id={groupId}
        legend={ROUTE_QUESTION}
        hint={ROUTE_HINT}
        value={routeId}
        onValueChange={(value) => {
          const route = remittanceRoute(value);
          if (!route) return;
          onRouteChange(route.id, conditionAnswerForRoute(route));
        }}
        options={REMITTANCE_ROUTES.map((route, index) => ({
          value: route.id,
          label: route.label,
          description: route.description,
          // The result panel links "still to answer" items at the first option
          // of the group that answers them. That link is only worth having if
          // it lands somewhere, and the generic yes/no's first option does not
          // exist on this rendering — so the id is carried across explicitly.
          ...(index === 0
            ? { optionId: conditionFirstOptionId(fieldId, question.id) }
            : {}),
        }))}
        error={showUnansweredAsError && chosen === null ? ROUTE_UNANSWERED_ERROR : null}
      />

      {chosen && <RouteConsequence route={chosen} />}

      {chosen?.id === MIXTURE_ROUTE_ID && (
        <MixtureSplit
          fieldId={fieldId}
          amounts={amounts}
          onAmountChange={onAmountChange}
        />
      )}

      {/* The statutory test itself, shown rather than asked. It is what the
          tool is resolving on the user's behalf, and a person who wants to
          check the tool's reasoning needs to see it — with its evidence note
          and a real link to the provision, never a tooltip. */}
      <div className="calc-routes__law">
        <p className="calc-condition__evidence">
          <span className="calc-condition__evidence-label">
            What the law actually asks:{' '}
          </span>
          {question.condition.question}
        </p>
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
    </div>
  );
}

/* ========================================================================= */

/**
 * What the chosen route means, said where the choice was made.
 *
 * Deliberately not a duplicate of the engine's own output. For the offshore
 * route the engine already raises `rate-cap-condition-not-met` with the amount
 * it affected and the provision behind it, and `WarningList` renders that above
 * the figure; the note here carries no amount and no rate, and exists so the
 * user "learns the condition exists" at the moment they answer rather than four
 * screens later [P11, Acceptance].
 */
function RouteConsequence({ route }: { route: RemittanceRoute }) {
  const { outcome } = route;

  if (outcome.kind === 'met') return null;

  if (outcome.kind === 'not-met') {
    return (
      <Callout
        tone={SEVERITY_TONE.warn}
        headingLevel={4}
        title="On that answer, the reduced treatment does not apply to this money"
      >
        <p>
          The law allows a lower maximum rate on this kind of income only where the
          condition set out below is met, and on what you have told us it was not met for
          this money. The ordinary rates have been used for it instead, and the law
          provides nothing lower to fall back to. The result further down says the same
          thing again and gives the amount it affected.
        </p>
      </Callout>
    );
  }

  if (outcome.kind === 'unresolved') {
    const copy = warningCopy(UI_WARNING_CODES.conditionUnresolved);
    return (
      <Callout
        tone={SEVERITY_TONE.warn}
        headingLevel={4}
        title={copy.title}
        footer={
          <p className="calc-routes__reference">
            Reference: <code>{UI_WARNING_CODES.conditionUnresolved}</code>
            {' · open question '}
            <code>{outcome.question}</code>
            {' in this project’s research register'}
          </p>
        }
      >
        <p>{copy.meaning}</p>
        <p className="calc-routes__detail">{outcome.detail}</p>
      </Callout>
    );
  }

  return (
    <Callout
      tone={SEVERITY_TONE.warn}
      headingLevel={4}
      title="No figure can be worked out when the money came by more than one route"
      footer={
        <p className="calc-routes__reference">
          Reference: open question <code>{outcome.question}</code> in this project’s
          research register
        </p>
      }
    >
      <p>
        Whether the reduced treatment then applies to the part that came into Sri Lanka,
        to all of this money, or to none of it is not settled by the Act, and no Inland
        Revenue Department guidance this project holds settles it either. We are not going
        to guess at your tax, so no figure has been computed. The result further down sets
        this out in full in place of an amount.
      </p>
      <p>
        The boxes below are so the split is written down. Nothing is worked out from them,
        they are not added together, and they change no figure — they are there to take
        with you to a qualified tax practitioner.
      </p>
    </Callout>
  );
}

/* ========================================================================= */

/**
 * An amount against each route — "A mixture — enter an amount against each"
 * [`docs/spec/ui-behaviour.md`].
 *
 * **These figures never enter the computation.** They are not summed, not
 * compared with the total above, and not passed to `buildTaxInput`; a subtotal
 * computed here would be a subtotal no fixture covers. They are a record of
 * what happened, for a person who has just been told no figure can be produced
 * and needs to take the facts somewhere else.
 */
function MixtureSplit({
  fieldId,
  amounts,
  onAmountChange,
}: {
  fieldId: MoneyFieldId;
  amounts: Readonly<Record<string, number | null>>;
  onAmountChange: (routeId: string, value: number | null) => void;
}) {
  return (
    <div className="calc-route-split">
      <p className="calc-route-split__legend">How much came by each route</p>
      <p className="calc-route-split__note">
        In rupees, as far as you can work it out. An empty box is not a zero, and no box
        here has to be filled in for anything to happen — nothing is computed from them
        either way.
      </p>
      {SPLIT_ROUTES.map((route) => (
        <CurrencyField
          key={route.id}
          id={splitFieldElementId(fieldId, route.id)}
          label={route.splitLabel}
          optional
          value={amounts[route.id] ?? null}
          onChange={(value) => onAmountChange(route.id, value)}
        />
      ))}
    </div>
  );
}

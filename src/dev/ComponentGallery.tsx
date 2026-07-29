/**
 * The component gallery — every P08 primitive and every P09 constrained
 * component, in every state it has.
 *
 * DEV ONLY. This file lives in `src/dev/`, not in `src/pages/`, and the route
 * that renders it is injected by `astro.config.mjs` only when the command is
 * `dev`. `npm run build` never sees a page importing it, so nothing here
 * reaches `dist/`. `src/dev/gallery-excluded-from-build.test.ts` asserts that
 * mechanically rather than trusting this comment.
 *
 * IT IS ALSO THE TEST SUBJECT. `src/dev/gallery.a11y.test.tsx` runs axe over
 * this tree and `src/components/ui/touch-target.test.tsx` resolves the real
 * cascade against it at 320px. That is deliberate: a showcase that drifts from
 * what is tested is a showcase that lies, so there is only one of them.
 *
 * The figures below are invented for display — `45000`, `1234567`. They are
 * *not* tax data and nothing here computes anything. The UI never does
 * arithmetic; every real figure comes from `TaxResult`.
 */

import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { Callout } from '../components/ui/Callout.tsx';
import { Card } from '../components/ui/Card.tsx';
import { CitationRef } from '../components/ui/CitationRef.tsx';
import { CurrencyField } from '../components/ui/CurrencyField.tsx';
import { PersonaCardGroup } from '../components/ui/PersonaCard.tsx';
import { ProgressIndicator } from '../components/ui/ProgressIndicator.tsx';
import { RadioCardGroup } from '../components/ui/RadioCardGroup.tsx';
import { RefusalPanel } from '../components/ui/RefusalPanel.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { Stepper } from '../components/ui/Stepper.tsx';
import { Table } from '../components/ui/Table.tsx';
import { Tabs } from '../components/ui/Tabs.tsx';
import { TextField } from '../components/ui/TextField.tsx';
import { NotYetLawBadge, UnverifiedBadge } from '../components/ui/UnverifiedBadge.tsx';
import { WarningList } from '../components/ui/WarningList.tsx';
import {
  YearSelector,
  toYearOption,
  type YearOption,
} from '../components/ui/YearSelector.tsx';
import { formatRupees, formatRupeesWithUnit } from '../components/ui/currency.ts';
import { computeTax, type ResultWarning, type TaxResult } from '../lib/tax/engine.ts';
import { loadTaxYears } from '../lib/tax/load.ts';

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="gallery__section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {note && <p className="gallery__note">{note}</p>}
      {children}
    </section>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="gallery__state">{children}</h3>;
}

const ROUTE_OPTIONS = [
  {
    value: 'direct',
    label: 'Direct transfer into my Sri Lankan bank account',
    description: 'The money arrived in a rupee account at a bank in Sri Lanka.',
  },
  {
    value: 'fx-account',
    label: 'Into a foreign-currency account at a Sri Lankan bank',
    description: 'The bank is in Sri Lanka, but the account holds foreign currency.',
  },
  {
    value: 'offshore',
    label: 'Kept in an account outside Sri Lanka',
    description: 'The money has not come into Sri Lanka.',
  },
  {
    value: 'unavailable',
    label: 'Something else',
    description: 'A route not listed above.',
    disabled: true,
    disabledReason: 'Not available in this demo — the live picker lands in P11.',
  },
] as const;

const YEAR_OPTIONS = [
  { value: '2025-2026', label: '2025/2026 (1 Apr 2025 – 31 Mar 2026)' },
  {
    value: '2024-2025',
    label: '2024/2025 (1 Apr 2024 – 31 Mar 2025)',
    note: '3 figures in this year are not yet confirmed against primary law',
  },
  {
    value: '2026-2027',
    label: '2026/2027 (1 Apr 2026 – 31 Mar 2027)',
    note: 'Not yet law',
    disabled: true,
  },
] as const;

const PERSONAS = [
  {
    id: 'p1',
    situation: 'I work for overseas clients and get paid in foreign currency',
    covers: ['Business income', 'How the money reached you'],
  },
  {
    id: 'p2',
    situation: 'I am employed but no tax is deducted from my pay',
    covers: ['Employment income', 'Instalment dates'],
  },
  {
    id: 'p3',
    situation: 'I have a salary and also do freelance work',
    covers: ['Employment income', 'Business income'],
  },
  {
    id: 'p4',
    situation: 'I have interest, dividends, rent, or I sold property',
    covers: ['Investment income', 'Capital gains'],
  },
] as const;

const WORKING_COLUMNS = [
  { key: 'step', header: 'Step', rowHeader: true },
  { key: 'basis', header: 'Basis' },
  { key: 'amount', header: 'Amount (Rs.)', numeric: true },
] as const;

const WORKING_ROWS = [
  { step: 'Assessable income', basis: 'Entered', amount: formatRupees(1234567) },
  { step: 'Personal relief', basis: 'Applied in full', amount: formatRupees(1800000) },
  { step: 'Taxable income', basis: 'After relief', amount: formatRupees(0) },
] as const;

// ---------------------------------------------------------------------------
// P09 fixtures — real `TaxResult`s from `computeTax()` over the real data
// file, not hand-written objects. A hand-written refusal or warning set could
// drift from the engine's actual shape and this gallery would never notice;
// `computeTax` cannot drift from itself. Same fixtures as
// `RefusalPanel.test.tsx`, deliberately.
// ---------------------------------------------------------------------------

const GALLERY_TAX_YEAR = loadTaxYears()[0]!.data;

/** The engine's one refusal (Q14): capped and uncapped income on the same
 * ladder, with no statutory ordering between them. */
const REFUSED_RESULT: TaxResult = computeTax(
  {
    residency: 'resident',
    income: {
      employment: [{ label: 'Salary', amount: 2_000_000 }],
      business: [
        {
          label: 'Overseas clients, paid into my bank here',
          amount: 3_000_000,
          tags: ['foreign-capped'],
          conditions: { 'remitted-through-bank-to-sri-lanka': true },
        },
        {
          label: 'Overseas clients, left abroad',
          amount: 500_000,
          tags: ['foreign-capped'],
          conditions: { 'remitted-through-bank-to-sri-lanka': false },
        },
      ],
    },
  },
  GALLERY_TAX_YEAR,
);

/**
 * A computed result with no warnings — the ordinary case, and a demo that
 * would otherwise nest a second `WarningList` with the same default heading
 * as the one inside the refused example above (landmark-unique failure).
 */
const COMPUTED_RESULT: TaxResult = computeTax(
  {
    residency: 'resident',
    income: { employment: [{ label: 'Salary', amount: 3_000_000 }] },
  },
  GALLERY_TAX_YEAR,
);

/** A code no build has plain-language wording for. `warning-copy.ts`
 * guarantees this still renders, on the message alone. */
const UNKNOWN_CODE_WARNING: ResultWarning = {
  code: 'demo-unrecognised-code',
  message:
    'Demo only — this is not a real engine code. It shows that WarningList never drops a warning it has no wording for.',
  severity: 'info',
};

const GALLERY_WARNINGS: ResultWarning[] = [
  ...COMPUTED_RESULT.warnings,
  ...REFUSED_RESULT.warnings,
  UNKNOWN_CODE_WARNING,
];

/** Mirrors `YearSelector.test.tsx`: the real year, plus a proposed year and a
 * clean year, since no data file yet declares either. */
const GALLERY_YEARS: YearOption[] = [
  toYearOption(GALLERY_TAX_YEAR),
  {
    yearOfAssessment: '2026/2027',
    status: 'proposed',
    lastReviewed: '2026-07-28',
    unverifiedCount: 5,
  },
  {
    yearOfAssessment: '2024/2025',
    status: 'enacted',
    lastReviewed: '2025-04-01',
    unverifiedCount: 0,
  },
];

export function ComponentGallery() {
  // Every field starts null — empty is not zero, including here.
  const [amount, setAmount] = useState<number | null>(null);
  const [prefilled, setPrefilled] = useState<number | null>(1234567);
  const [text, setText] = useState('');
  const [route, setRoute] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  // No default here either — YearSelector's whole point is that this starts null.
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  return (
    <div className="gallery">
      <Callout
        tone="neutral"
        title="This page is a component gallery, not the calculator"
      >
        <p>
          Every primitive from P08 is shown here in each state it has. Nothing on this
          page computes anything, and none of the figures shown are tax data. The page is
          injected only by <code>astro dev</code> and is absent from a production build.
        </p>
      </Callout>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="currency"
        title="CurrencyField"
        note="Integer rupees leave this component. Empty is null, never zero. Decimals are refused rather than rounded, and the message appears on blur — not while you are still typing."
      >
        <StateLabel>Empty — nothing entered</StateLabel>
        <CurrencyField
          label="Income from overseas clients"
          hint="Whole rupees. Commas are added for you; “Rs.” and separators in a pasted figure are stripped."
          value={amount}
          onChange={setAmount}
          onValidityChange={({ valid }) => setStale(!valid)}
        />
        <p className="gallery__readout">
          Value leaving the component:{' '}
          <code>{amount === null ? 'null (not entered)' : String(amount)}</code>
          {stale && <strong> — last figure is stale, the field cannot be read</strong>}
        </p>

        <StateLabel>Valid — a figure entered</StateLabel>
        <CurrencyField
          label="Employment income for the year"
          hint="Whole rupees."
          value={prefilled}
          onChange={setPrefilled}
        />

        <StateLabel>Invalid — refused, with the reason</StateLabel>
        <CurrencyField
          label="Interest received"
          value={null}
          onChange={() => {}}
          error="Enter a whole number of rupees. This tool works in whole rupees, so an amount with cents cannot be accepted — even when the cents are 00. Remove the decimal point and enter the whole-rupee figure you are declaring."
        />

        <StateLabel>Optional</StateLabel>
        <CurrencyField
          label="Rent received"
          optional
          value={null}
          onChange={() => {}}
          hint="Leave blank if you had none. A blank field is not a declared zero."
        />

        <StateLabel>Disabled</StateLabel>
        <CurrencyField
          label="Terminal benefit"
          disabled
          value={null}
          onChange={() => {}}
          hint="Available once you have said how many years of service you completed."
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="textfield" title="TextField">
        <StateLabel>Empty</StateLabel>
        <TextField
          label="Taxpayer Identification Number (TIN)"
          hint="Nine digits, from your IRD registration."
          value={text}
          onChange={setText}
        />

        <StateLabel>Valid</StateLabel>
        <TextField label="Name as registered" value="A. Perera" onChange={() => {}} />

        <StateLabel>Invalid</StateLabel>
        <TextField
          label="Taxpayer Identification Number (TIN)"
          value="12345"
          onChange={() => {}}
          error="A TIN is nine digits. This one has five."
        />

        <StateLabel>Optional</StateLabel>
        <TextField
          label="Practitioner’s reference"
          optional
          value=""
          onChange={() => {}}
        />

        <StateLabel>Disabled</StateLabel>
        <TextField label="Assessment number" disabled value="" onChange={() => {}} />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="button" title="Button">
        <StateLabel>Variants, resting and on hover</StateLabel>
        <div className="gallery__row">
          <Button variant="primary">Show my figure</Button>
          <Button variant="secondary">Change year</Button>
          <Button variant="quiet">See the working</Button>
          <Button variant="danger">Clear everything I entered</Button>
        </div>

        <StateLabel>Disabled, with the reason stated</StateLabel>
        <div className="gallery__row">
          <Button
            variant="primary"
            disabled
            disabledReason="Choose a year of assessment first — every rate depends on it."
          >
            Show my figure
          </Button>
        </div>

        <StateLabel>Busy</StateLabel>
        <div className="gallery__row">
          <Button variant="secondary" busy>
            Preparing the printout
          </Button>
        </div>

        <StateLabel>Full width, as used on a phone</StateLabel>
        <Button variant="primary" block>
          Show my figure
        </Button>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="radiocards"
        title="RadioCardGroup"
        note="One tab stop; arrow keys move between the cards. Options are data — nothing about a condition question is hardcoded in the component."
      >
        <StateLabel>Empty — nothing preselected</StateLabel>
        <RadioCardGroup
          legend="How did the money reach you?"
          hint="Choose the one that best describes it. If it was a mixture, say so on the next screen."
          options={ROUTE_OPTIONS}
          value={route}
          onValueChange={setRoute}
        />

        <StateLabel>Valid — one chosen</StateLabel>
        <RadioCardGroup
          legend="How did the money reach you?"
          options={ROUTE_OPTIONS.slice(0, 3)}
          value="direct"
          onValueChange={() => {}}
        />

        <StateLabel>Invalid</StateLabel>
        <RadioCardGroup
          legend="How did the money reach you?"
          options={ROUTE_OPTIONS.slice(0, 3)}
          value={null}
          onValueChange={() => {}}
          error="Choose how the money reached you. The answer changes which rate applies."
        />

        <StateLabel>Disabled group</StateLabel>
        <RadioCardGroup
          legend="How did the money reach you?"
          options={ROUTE_OPTIONS.slice(0, 2)}
          value={null}
          onValueChange={() => {}}
          disabled
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="personas"
        title="PersonaCard"
        note="The picker always carries a “none of these” card. The persona routes the questions; it never restricts them."
      >
        <PersonaCardGroup
          legend="Which of these is closest to your situation?"
          hint="This chooses which questions you are asked. You can change it at any point, and every section stays available."
          personas={PERSONAS}
          value={persona}
          onValueChange={setPersona}
        />

        <StateLabel>Invalid</StateLabel>
        <PersonaCardGroup
          legend="Which of these is closest to your situation?"
          personas={PERSONAS.slice(0, 2)}
          value={null}
          onValueChange={() => {}}
          error="Choose a situation, or “none of these”."
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="select"
        title="Select"
        note="Enter, Space or Alt+Down opens the list; arrows and type-ahead move within it; Escape closes it and returns focus to the trigger."
      >
        <StateLabel>Empty — no year defaulted from the clock</StateLabel>
        <Select
          label="Year of assessment"
          prompt="Choose a year"
          options={YEAR_OPTIONS}
          value={year}
          onValueChange={setYear}
          hint="Sri Lanka’s year of assessment runs 1 April to 31 March."
        />

        <StateLabel>Valid</StateLabel>
        <Select
          label="Year of assessment"
          prompt="Choose a year"
          options={YEAR_OPTIONS}
          value="2025-2026"
          onValueChange={() => {}}
        />

        <StateLabel>Invalid</StateLabel>
        <Select
          label="Year of assessment"
          prompt="Choose a year"
          options={YEAR_OPTIONS}
          value={null}
          onValueChange={() => {}}
          error="Choose a year of assessment. Every rate in the result depends on it."
        />

        <StateLabel>Disabled</StateLabel>
        <Select
          label="Year of assessment"
          prompt="Choose a year"
          options={YEAR_OPTIONS}
          value={null}
          onValueChange={() => {}}
          disabled
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="callout"
        title="Callout"
        note="No dismiss control and no collapse, at any tone. P09 builds WarningList and RefusalPanel on this, and ADR-0003 forbids hiding either behind a disclosure."
      >
        <Callout tone="info" title="What this tool does">
          <p>It shows what the recorded law produces from the figures you enter.</p>
        </Callout>
        <Callout tone="caution" title="A rate used here is not yet confirmed">
          <p>
            One figure in this year’s data has not been checked against the Act. Treat the
            result as provisional.
          </p>
        </Callout>
        <Callout tone="danger" title="We are not going to guess at your tax">
          <p>
            The law does not clearly say how this case is treated, so no figure is shown.
          </p>
        </Callout>
        <Callout tone="positive" title="Nothing appears to be owed">
          <p>On the figures entered, the computed liability is nil.</p>
        </Callout>
        <Callout tone="neutral" title="Keeping a copy">
          <p>Print this page to take the working to a practitioner.</p>
        </Callout>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="card" title="Card">
        <Card title="Ordinary card" headingLevel={3}>
          <p>A raised surface with a heading.</p>
        </Card>
        <Card title="Sunken" headingLevel={3} tone="sunken">
          <p>Used for a well inside another card.</p>
        </Card>
        <Card
          title="Emphasis — the result panel’s shape"
          headingLevel={3}
          titleAside={<span>Y/A 2025/2026 · figures as at 1 April 2025</span>}
          emphasis
          footer={<p>Verify with the IRD or a qualified practitioner before you file.</p>}
        >
          <p>Larger radius and padding, per the design system.</p>
        </Card>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="table"
        title="Table"
        note="A real table with scoped headers. Numeric columns are tabular and align to the end, so a column of figures can actually be checked."
      >
        <StateLabel>With rows</StateLabel>
        <Table
          caption="How the figure was reached — with rows"
          columns={WORKING_COLUMNS}
          rows={WORKING_ROWS}
          emptyMessage="Nothing to show yet."
        />

        <StateLabel>Empty — words, never a zero</StateLabel>
        <Table
          caption="How the figure was reached — empty"
          columns={WORKING_COLUMNS}
          rows={[]}
          emptyMessage="No figures entered yet. Nothing has been computed."
        />

        <StateLabel>Loading</StateLabel>
        <Table
          caption="How the figure was reached — loading"
          columns={WORKING_COLUMNS}
          rows={[]}
          loading
          emptyMessage="No figures entered yet."
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="stepper" title="Stepper">
        <Stepper
          ariaLabel="Progress through the questions"
          steps={[
            {
              id: 'persona',
              label: 'Your situation',
              status: 'complete',
              onSelect: () => {},
            },
            {
              id: 'year',
              label: 'Year of assessment',
              status: 'complete',
              onSelect: () => {},
            },
            { id: 'income', label: 'Income', status: 'current' },
            { id: 'credits', label: 'Tax already paid', status: 'attention' },
            { id: 'result', label: 'Result', status: 'upcoming' },
          ]}
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="progress" title="ProgressIndicator">
        <StateLabel>Nothing answered yet</StateLabel>
        <ProgressIndicator value={0} max={8} label="Question 1 of 8" />
        <StateLabel>Part way</StateLabel>
        <ProgressIndicator value={3} max={8} label="Question 4 of 8" />
        <StateLabel>Complete</StateLabel>
        <ProgressIndicator value={8} max={8} label="All 8 questions answered" />
        <StateLabel>Indeterminate</StateLabel>
        <ProgressIndicator
          value={null}
          max={8}
          label="Working out how many questions apply"
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="tabs"
        title="Tabs"
        note="For comparing equivalent things only. Nothing load-bearing goes in a tab panel — an unselected panel is hidden, and ADR-0003 forbids hiding a warning, a refusal or the disclaimer."
      >
        <Tabs
          ariaLabel="Rate bands by year of assessment"
          items={[
            {
              value: '2025-2026',
              label: '2025/2026',
              content: (
                <p>Bands for Y/A 2025/2026 would be rendered from the data file.</p>
              ),
            },
            {
              value: '2024-2025',
              label: '2024/2025',
              content: <p>Bands for Y/A 2024/2025.</p>,
            },
            {
              value: '2026-2027',
              label: '2026/2027',
              content: <p>Not yet law.</p>,
              disabled: true,
            },
          ]}
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="skeleton"
        title="Skeleton"
        note="Never used behind a tax figure — the computation is local and synchronous, and a skeleton there would imply a number is on its way from somewhere."
      >
        <Skeleton lines={3} width="half" label="Loading the sources register" />
        <StateLabel>Block</StateLabel>
        <Skeleton variant="block" />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="warninglist"
        title="WarningList"
        note="TaxResult.warnings, above the result, always expanded — ADR-0003 decision 3. Sorted blocking-first. A code this build has no wording for still renders, on the engine's own message."
      >
        <StateLabel>Empty — no warnings renders nothing at all</StateLabel>
        <p className="gallery__readout">
          <code>{'<WarningList warnings={[]} />'}</code> renders <code>null</code> — no
          box, no “no warnings” reassurance. Nothing appears below this line:
        </p>
        <WarningList warnings={[]} />

        <StateLabel>
          Populated — mixed severities, real engine codes, and one unrecognised code
        </StateLabel>
        <WarningList
          warnings={GALLERY_WARNINGS}
          id="gallery-warninglist-demo"
          heading="Read this before the figure — standalone demo"
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="refusalpanel"
        title="RefusalPanel"
        note="The gate between a TaxResult and anything that renders a figure. children is a callback invoked only on the non-refused path, so a caller cannot accidentally render both. Refusals replace the figure; warnings sit above it; neither collapses."
      >
        <StateLabel>Refused (Q14) — no figure anywhere on the page</StateLabel>
        <RefusalPanel result={REFUSED_RESULT}>
          {(result) => (
            <p className="figure">
              Tax payable {formatRupeesWithUnit(result.taxPayable)}
            </p>
          )}
        </RefusalPanel>

        <StateLabel>Computed — warnings above the figure, in that order</StateLabel>
        <RefusalPanel result={COMPUTED_RESULT}>
          {(result) => (
            <p className="figure">
              Tax payable {formatRupeesWithUnit(result.taxPayable)}
            </p>
          )}
        </RefusalPanel>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="citation"
        title="CitationRef"
        note="Beside every displayed rate. Never a tooltip, never dismissible, and never hidden when the key does not resolve — the gap stays visible instead."
      >
        <StateLabel>Resolved, with a pinpoint</StateLabel>
        <p className="gallery__readout">
          Personal relief{' '}
          <CitationRef src="pn-it-2025-01#para 1" sources={GALLERY_TAX_YEAR.sources} />
        </p>

        <StateLabel>Whole-document reference, no pinpoint</StateLabel>
        <p className="gallery__readout">
          Base act <CitationRef src="ira-2017" sources={GALLERY_TAX_YEAR.sources} />
        </p>

        <StateLabel>
          Unresolved — the key does not resolve, and stays visible anyway
        </StateLabel>
        <p className="gallery__readout">
          <CitationRef
            src="ird-notice-not-in-sources-map#para 9"
            sources={GALLERY_TAX_YEAR.sources}
          />
        </p>

        <StateLabel>With a visible label</StateLabel>
        <p className="gallery__readout">
          <CitationRef
            src="act-2-2025#s.3"
            sources={GALLERY_TAX_YEAR.sources}
            label="Rate from"
          />
        </p>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="unverified-badge"
        title="UnverifiedBadge / NotYetLawBadge"
        note="Never colour alone: an icon whose shape carries the meaning, plus the words, every time. There is deliberately no “verified” counterpart — an unmarked figure makes no claim either way."
      >
        <StateLabel>UnverifiedBadge, naming the figure</StateLabel>
        <UnverifiedBadge what="the capital gains rate" />

        <StateLabel>UnverifiedBadge, compact — for a table cell</StateLabel>
        <UnverifiedBadge what="1 figure in this year" compact />

        <StateLabel>NotYetLawBadge</StateLabel>
        <NotYetLawBadge yearOfAssessment="2026/2027" />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="yearselector"
        title="YearSelector"
        note="No default is preselected, ever — there is no Date in this component. A proposed year carries the not-yet-law badge and a caution notice; every year states its count of unverified figures."
      >
        <StateLabel>Empty — nothing selected on first visit</StateLabel>
        <YearSelector
          years={GALLERY_YEARS}
          value={selectedYear}
          onChange={setSelectedYear}
        />
      </Section>
    </div>
  );
}

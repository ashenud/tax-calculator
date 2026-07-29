/**
 * "What to do next — TIN, e-filing, and the verify-before-you-file line"
 * [`docs/spec/ui-behaviour.md`, Result §4].
 *
 * Static and generic on purpose. `docs/research/11-filing-walkthrough.md`
 * settles exactly one fact this section can state as fact — e-filing is
 * mandatory for individuals from Y/A 2023/2024 [IRA s.113(1)(B)] — and records
 * everything else about the mechanics (how a TIN is obtained, which schedules
 * apply, what the portal expects) as **open**, unverified against a primary
 * source this repository holds. So this section says that a TIN is needed and
 * that filing is electronic, and stops there rather than inventing a
 * step-by-step it cannot back with a citation [CLAUDE.md rule 3].
 *
 * No rupee figure, no date, no rate — nothing here needs `TaxResult` at all,
 * which is itself the tell that this component computes nothing.
 */

import { Card, Callout, CitationRef } from '../ui/index.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './calculator.css';

export interface WhatNextProps {
  taxYear: TaxYearFile;
}

export function WhatNext({ taxYear }: WhatNextProps) {
  return (
    <Card title="What to do next" headingLevel={3} id="calc-what-next">
      <ul className="calc-what-next">
        <li>
          If you do not already have a Taxpayer Identification Number (TIN), you need one
          before you can file a return.
        </li>
        <li>
          Filing is done electronically — it is mandatory for an individual from year of
          assessment 2023/2024 onward.{' '}
          <CitationRef
            src="ira-2017#s.113(1)(B)"
            sources={taxYear.sources}
            label="Requirement from"
          />
        </li>
      </ul>

      <Callout tone="caution" headingLevel={4} title="Verify this before you file">
        <p>
          Nothing on this page is tax advice. Check the figures above, and the working
          behind them, against the Inland Revenue Department or a qualified tax
          practitioner before you rely on them to file or to pay.
        </p>
      </Callout>
    </Card>
  );
}

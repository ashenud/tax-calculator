/**
 * Step 8 of `TaxResult`, rendered: instalments, the final payment, the return
 * due date.
 *
 * NOTHING HERE COMPUTES. `schedule.instalments`, `schedule.finalPayment` and
 * `schedule.returnDue` are read exactly as `computeTax` produced them; the one
 * piece of interpretation this file does is choosing *words* for a sign
 * (`finalPayment.amount` positive vs negative) and for absence
 * (`instalments.length === 0`), never a number of its own.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FINAL PAYMENT ONLY APPEARS WHEN INSTALMENTS DO
 * ---------------------------------------------------------------------------
 *
 * `TaxResult`'s own contract: "`instalments.length > 0` is the signal that a
 * schedule was computed... When it is empty, `finalPayment` is a zeroed
 * placeholder and must not be rendered as a payment of nil." So this component
 * gates on the same signal the engine documents, not on `finalPayment.amount`
 * itself — a zeroed placeholder and a genuine nil balance are both `0` and are
 * not the same fact.
 *
 * `finalPayment.due` is always `''` — whether a date exists separately from
 * the last instalment is Q22, unverified — so it is never rendered as a date.
 * When a balance is actually payable the engine has already raised
 * `final-payment-date-unresolved` above this component, via `WarningList`;
 * this component does not repeat that explanation, only the amount.
 *
 * ---------------------------------------------------------------------------
 * CITATIONS
 * ---------------------------------------------------------------------------
 *
 * Each instalment date is fixed by `taxYear.calendar.instalments[i].src`, a
 * per-quarter citation the data carries but `TaxResult.schedule.instalments`
 * does not repeat (it only carries `quarter`, `due`, `amount`). Matching by
 * `quarter` is a direct key lookup, not a resolution rule with branches to get
 * wrong, so it is done here rather than left uncited. `returnDue`'s citation is
 * `taxYear.calendar.returnDueRule.src`, the same way.
 */

import { Card, CitationRef, Table, formatRupees } from '../ui/index.ts';
import type { ComputedTaxResult } from '../ui/RefusalPanel.tsx';
import type { TaxYearFile } from '../../lib/tax/schema.ts';
import './calculator.css';

export interface PaymentScheduleProps {
  result: ComputedTaxResult;
  taxYear: TaxYearFile;
}

export function PaymentSchedule({ result, taxYear }: PaymentScheduleProps) {
  const { schedule } = result;
  const hasSchedule = schedule.instalments.length > 0;

  return (
    <Card title="When this is due" headingLevel={3} id="calc-schedule">
      <div className="calc-working">
        <Table
          caption="Instalment payments through the year"
          columns={[
            { key: 'quarter', header: 'Instalment', rowHeader: true },
            { key: 'due', header: 'Due' },
            { key: 'amount', header: 'Amount (Rs.)', numeric: true },
            { key: 'citation', header: 'Where this date comes from' },
          ]}
          rows={schedule.instalments.map((instalment) => {
            const src = taxYear.calendar.instalments.find(
              (candidate) => candidate.quarter === instalment.quarter,
            )?.src;
            return {
              quarter: `Quarter ${instalment.quarter}`,
              due: instalment.due,
              amount: formatRupees(instalment.amount),
              citation: src ? <CitationRef src={src} sources={taxYear.sources} /> : '',
            };
          })}
          emptyMessage="No instalment schedule has been worked out, because no estimate of tax payable for this year was given. Enter your own estimate above, if you have filed one, to see the schedule that follows from it."
        />

        {hasSchedule && (
          <p className="calc-schedule__final">
            {schedule.finalPayment.amount > 0 ? (
              <>
                A further{' '}
                <strong className="figure">
                  {formatRupees(schedule.finalPayment.amount)}
                </strong>{' '}
                rupees is payable once the instalments above are accounted for. The
                warning above explains why no date is shown for it.
              </>
            ) : schedule.finalPayment.amount < 0 ? (
              <>
                The instalments above come to{' '}
                <strong className="figure">
                  {formatRupees(-schedule.finalPayment.amount)}
                </strong>{' '}
                rupees more than the tax actually worked out below — an overpayment rather
                than a balance due. The warning above says more about it.
              </>
            ) : (
              <>
                The instalments above account for the whole amount; nothing further is
                due.
              </>
            )}
          </p>
        )}

        <p className="calc-schedule__return-due">
          The return itself is due{' '}
          <strong className="figure">{schedule.returnDue}</strong>.{' '}
          <CitationRef
            src={taxYear.calendar.returnDueRule.src}
            sources={taxYear.sources}
            label="Deadline from"
          />
        </p>
      </div>
    </Card>
  );
}

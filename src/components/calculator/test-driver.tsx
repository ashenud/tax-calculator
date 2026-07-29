/**
 * Test-only helpers for driving the calculator the way a person would.
 *
 * Not a `.test.tsx`, so Vitest does not collect it, and nothing under
 * `src/pages/` imports it, so it never reaches a build. It exists because the
 * flow — persona, year, where you lived, then amounts — is the preamble to
 * almost every assertion worth making, and repeating it in five files would
 * make each of those files about the preamble.
 *
 * Everything here goes through `@testing-library/user-event`, which dispatches
 * real events, rather than calling props directly: what is asserted is then
 * what a person gets, not what the component's signature suggests they should.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { TaxCalculator } from './TaxCalculator.tsx';
import { loadTaxYears } from '../../lib/tax/load.ts';
import type { TaxYearFile } from '../../lib/tax/schema.ts';

export const REAL_TAX_YEARS: readonly TaxYearFile[] = loadTaxYears().map(
  (loaded) => loaded.data,
);

export const REAL_TAX_YEAR: TaxYearFile = REAL_TAX_YEARS[0]!;

export function renderCalculator(taxYears: readonly TaxYearFile[] = REAL_TAX_YEARS) {
  const user = userEvent.setup();
  const utils = render(<TaxCalculator taxYears={taxYears} />);
  return { user, ...utils };
}

export async function choosePersona(user: UserEvent, situation: RegExp): Promise<void> {
  await user.click(screen.getByRole('radio', { name: situation }));
}

export async function chooseYear(
  user: UserEvent,
  yearOfAssessment: string,
): Promise<void> {
  await user.click(screen.getByRole('combobox', { name: /year of assessment/i }));
  await screen.findByRole('listbox');
  await user.click(
    screen.getByRole('option', {
      name: new RegExp(yearOfAssessment.replace('/', '\\/')),
    }),
  );
}

export async function chooseResidency(
  user: UserEvent,
  label: RegExp = /I lived in Sri Lanka for that year/i,
): Promise<void> {
  await user.click(screen.getByRole('radio', { name: label }));
}

/** Persona, year and residency, so a test can get to the questions it is about. */
export async function startFlow(
  user: UserEvent,
  situation: RegExp,
  yearOfAssessment: string = REAL_TAX_YEAR.yearOfAssessment,
): Promise<void> {
  await choosePersona(user, situation);
  await chooseYear(user, yearOfAssessment);
  await chooseResidency(user);
}

export async function enterAmount(
  user: UserEvent,
  label: RegExp,
  digits: string,
): Promise<void> {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, digits);
  // Blur, so the field normalises and reports its validity — the same thing
  // moving to the next question would do.
  await user.tab();
}

/** Answer one condition question by the text of the question itself. */
export async function answerCondition(
  user: UserEvent,
  question: string,
  answer: 'Yes' | 'No',
): Promise<void> {
  const group = screen.getByRole('radiogroup', { name: question });
  await user.click(within(group).getByRole('radio', { name: answer }));
}

/** The figure, or `null` when none is on the page. */
export function figureText(container: HTMLElement): string | null {
  return container.querySelector('.calc-figure')?.textContent ?? null;
}

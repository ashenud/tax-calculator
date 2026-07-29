/**
 * Rupee parsing and formatting — the core of `CurrencyField`, kept pure.
 *
 * WHY THIS IS A SEPARATE FILE
 * Money entry is where calculators lose people, so the part that decides what a
 * typed string *means* is isolated from React, from the DOM, and from any
 * styling. It can then be exhaustively tested as a function, and the component
 * around it becomes a thin shell whose only job is presentation and events.
 *
 * THE FOUR RULES THIS FILE ENFORCES
 *
 *  1. **Integer rupees, always.** CLAUDE.md rule 4: no floats anywhere on a
 *     calculation path. `parseRupees` never returns a fractional number — it
 *     refuses the input instead.
 *
 *  2. **Empty is `null`, not `0`.** An untouched field has not been declared as
 *     nil. `''` parses to `{ ok: true, value: null }`, and every consumer must
 *     carry that `null` through rather than coalescing it to zero. Showing
 *     `Rs. 0` for a field nobody filled in tells the user a computation
 *     happened when it did not.
 *
 *  3. **Parse permissively, store strictly.** A figure pasted off a payslip or
 *     a bank statement arrives as `Rs. 45,000/-`, with non-breaking spaces and
 *     a currency prefix. All of that is stripped. What comes out is an integer.
 *
 *  4. **Decimals are refused, never rounded.** Silently turning `12.50` into
 *     `12` or `13` changes a figure the user is going to declare to the IRD.
 *     The refusal is explicit and explains itself. This holds even when the
 *     cents are `00`: normalising `45,000.00` would be exact, but it would also
 *     be a silent rewrite of what the user typed, and predictability is worth
 *     more here than the keystrokes it saves.
 *
 * Formatting is display-only. `formatRupees` produces a string for the view and
 * that string is never parsed back into the model — the model holds the number.
 */

/** Why an entry was refused. The UI maps these to copy; the copy lives here. */
export type CurrencyParseErrorCode =
  'decimal' | 'negative' | 'not-a-number' | 'too-large';

export type CurrencyParseResult =
  | {
      readonly ok: true;
      /** `null` means "nothing entered". It does NOT mean zero. */
      readonly value: number | null;
    }
  | {
      readonly ok: false;
      readonly code: CurrencyParseErrorCode;
      /** User-facing. Explains the rule rather than restating the failure. */
      readonly message: string;
    };

/**
 * The refusal copy, in one place so it can be reviewed as content.
 *
 * Each one says what the tool does and what to type instead. None of them tells
 * the user what to declare — that is not this tool's role (CLAUDE.md rule 6).
 */
export const CURRENCY_MESSAGES: Readonly<Record<CurrencyParseErrorCode, string>> = {
  decimal:
    'Enter a whole number of rupees. This tool works in whole rupees, so an amount ' +
    'with cents cannot be accepted — even when the cents are 00. Remove the decimal ' +
    'point and enter the whole-rupee figure you are declaring.',
  negative:
    'Enter the amount as a positive figure. A minus sign is not accepted here; each ' +
    'question asks for an amount, and the tool decides how it is applied.',
  'not-a-number':
    'Enter an amount using digits, for example 450000. Commas, spaces and a “Rs.” ' +
    'or “LKR” prefix are fine — other characters cannot be read as an amount.',
  'too-large':
    'That amount is larger than this tool can hold exactly. Enter an amount up to ' +
    'Rs. 9,007,199,254,740,991.',
};

/**
 * Currency prefixes and suffixes seen on Sri Lankan payslips, invoices and bank
 * statements. `/-` is the local convention for "and no cents" and is stripped
 * rather than treated as a stray character.
 *
 * The Sinhala (රු) and Tamil (ரூ) marks are here because the site is intended
 * to carry those translations, and a user pasting from a Sinhala-language
 * statement should not be told their figure is unreadable.
 */
const CURRENCY_MARK = /(?:^\s*(?:rs\.?|lkr|₨|රු\.?|ரூ\.?)|\/-\s*$)/giu;

/**
 * Everything that is legitimately noise inside a typed amount: comma
 * separators, ordinary spaces, non-breaking space (U+00A0, what a copy from a
 * PDF usually carries), narrow no-break space (U+202F, what `Intl` emits in
 * some locales), and the Unicode thin space.
 */
const SEPARATOR = /[,\s]/gu;

/**
 * Strip currency marks and separators, leaving the characters that carry
 * meaning. Deliberately does NOT judge what remains — that is `parseRupees`'s
 * job, and keeping the two apart is what lets the field echo back exactly the
 * odd thing a user typed instead of silently eating it.
 */
export function stripCurrencyNoise(raw: string): string {
  return raw.replace(CURRENCY_MARK, '').replace(SEPARATOR, '');
}

/** Anything that could plausibly be a decimal point in a pasted figure. */
const DECIMAL_MARK = /[.٫]/u;

/**
 * Turn what the user typed into an integer number of rupees, or a refusal.
 *
 * `''` (and anything that reduces to nothing, such as a bare `Rs.`) is
 * `{ ok: true, value: null }` — not entered, not zero. `'0'` is
 * `{ ok: true, value: 0 }` — a declared nil, which is a different statement.
 */
export function parseRupees(raw: string): CurrencyParseResult {
  const core = stripCurrencyNoise(raw);

  if (core === '') return { ok: true, value: null };

  if (DECIMAL_MARK.test(core)) {
    return { ok: false, code: 'decimal', message: CURRENCY_MESSAGES.decimal };
  }

  if (core.startsWith('-') || core.startsWith('−')) {
    return { ok: false, code: 'negative', message: CURRENCY_MESSAGES.negative };
  }

  // ASCII digits only. `Number('٤٥')` is NaN anyway, but being explicit means
  // the user gets the "digits, for example 450000" message rather than a
  // message about something else.
  if (!/^\d+$/u.test(core)) {
    return {
      ok: false,
      code: 'not-a-number',
      message: CURRENCY_MESSAGES['not-a-number'],
    };
  }

  const value = Number(core);

  // Beyond 2^53-1 a JavaScript number stops being able to represent every
  // integer, so the figure displayed back would not be the figure entered.
  // Refusing is the only honest option; rule 4 does not bend for large numbers.
  if (!Number.isSafeInteger(value)) {
    return { ok: false, code: 'too-large', message: CURRENCY_MESSAGES['too-large'] };
  }

  return { ok: true, value };
}

/**
 * Group a run of digits into three-digit comma groups: `1234567` → `1,234,567`.
 *
 * Done by hand rather than through `Intl.NumberFormat` on purpose. `Intl`
 * output varies with the ICU build shipped by the runtime — some builds group
 * `en-LK` in the South Asian lakh/crore style (`12,34,567`), some do not — and
 * a field whose separators depend on the user's browser build is a field whose
 * tests pass on the developer's machine and not on theirs.
 */
export function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
}

/**
 * Format an integer rupee value for display. Display only — the returned string
 * never re-enters the model.
 *
 * `null` returns `''`, never `Rs. 0`. Callers wanting a visible placeholder for
 * an unentered figure must supply their own words ("not yet entered"), because
 * a zero here would be a claim the user never made.
 */
export function formatRupees(value: number | null): string {
  if (value === null) return '';
  const sign = value < 0 ? '-' : '';
  return sign + groupDigits(String(Math.abs(value)));
}

/** `formatRupees` with the unit, for standalone figures: `Rs. 1,234,567`. */
export function formatRupeesWithUnit(value: number | null): string {
  if (value === null) return '';
  return `Rs. ${formatRupees(value)}`;
}

/**
 * What the input should show for what the user has typed so far.
 *
 * Separators appear WHILE TYPING, which means this runs on every keystroke —
 * but only when the entry is a clean run of digits. Anything else (a decimal
 * point mid-entry, a stray letter) is echoed back exactly as typed, minus the
 * currency noise. Regrouping a half-formed entry would move characters around
 * under the user's caret while they are still deciding what to type, and
 * validation does not happen on keystroke anyway — it happens on blur.
 */
export function displayForTyping(raw: string): string {
  const core = stripCurrencyNoise(raw);
  return /^\d*$/u.test(core) ? groupDigits(core) : core;
}

/**
 * Where the caret belongs after `displayForTyping` has inserted or removed
 * separators.
 *
 * Without this, typing a digit into the middle of `1,234,567` throws the caret
 * to a position that has nothing to do with where the user was. The position is
 * tracked in *significant characters* — everything except the separators this
 * component itself inserted — so it survives regrouping.
 *
 * @param raw           the value the input held, including the caret's own text
 * @param rawCaret      caret offset within `raw`
 * @param display       the value the input is about to hold
 * @returns caret offset within `display`
 */
export function caretAfterFormat(raw: string, rawCaret: number, display: string): number {
  const significantBefore = stripCurrencyNoise(raw.slice(0, rawCaret)).length;

  let seen = 0;
  for (let i = 0; i < display.length; i += 1) {
    if (seen === significantBefore) return i;
    if (display[i] !== ',') seen += 1;
  }
  return display.length;
}

/**
 * The rupee parser, exhaustively.
 *
 * The four cases P08 names by hand are asserted verbatim and first, because
 * they are the ones a reviewer will look for. Everything after them is the same
 * rules pushed at from other directions.
 *
 * Two properties are load-bearing and are asserted structurally rather than by
 * example, at the bottom of the file:
 *
 *   - nothing that parses successfully is ever a float
 *   - `''` is `null` and never `0`
 */

import { describe, expect, it } from 'vitest';
import {
  caretAfterFormat,
  CURRENCY_MESSAGES,
  displayForTyping,
  formatRupees,
  formatRupeesWithUnit,
  groupDigits,
  parseRupees,
  stripCurrencyNoise,
} from './currency.ts';

describe('the four cases P08 names', () => {
  it('"1,234,567" parses to the integer 1234567', () => {
    expect(parseRupees('1,234,567')).toEqual({ ok: true, value: 1234567 });
  });

  it('"" parses to null — not zero', () => {
    const result = parseRupees('');
    expect(result).toEqual({ ok: true, value: null });
    // Spelled out separately: `toEqual` would also pass if this were 0 and the
    // expectation had been written wrong, and this is the one place where that
    // mistake would be silent and expensive.
    expect(result.ok && result.value).not.toBe(0);
    expect(result.ok && result.value).toBeNull();
  });

  it('"12.50" is rejected with a message, and is not rounded to 12 or 13', () => {
    const result = parseRupees('12.50');
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, code: 'decimal' });
    expect(result.ok === false && result.message).toBe(CURRENCY_MESSAGES.decimal);
    expect(result.ok === false && result.message).toMatch(/whole number of rupees/);
    // No value escapes at all. Not 12, not 13, not null-with-a-warning.
    expect(result).not.toHaveProperty('value');
  });

  it('a pasted "Rs. 45,000" parses to 45000', () => {
    expect(parseRupees('Rs. 45,000')).toEqual({ ok: true, value: 45000 });
  });
});

describe('empty is not zero', () => {
  it.each([
    ['', 'nothing typed'],
    ['   ', 'only spaces'],
    ['Rs.', 'a bare currency prefix'],
    ['LKR ', 'a bare LKR prefix'],
    [' ', 'a lone non-breaking space from a paste'],
  ])('%j (%s) is null', (raw) => {
    expect(parseRupees(raw)).toEqual({ ok: true, value: null });
  });

  it('"0" is zero — a declared nil is a different statement from an empty field', () => {
    expect(parseRupees('0')).toEqual({ ok: true, value: 0 });
  });

  it('"0" and "" do not parse to the same thing', () => {
    const zero = parseRupees('0');
    const empty = parseRupees('');
    expect(zero).not.toEqual(empty);
  });
});

describe('permissive parsing of what people actually paste', () => {
  it.each([
    ['Rs. 45,000', 45000],
    ['Rs.45000', 45000],
    ['RS 45,000', 45000],
    ['rs. 45,000', 45000],
    ['LKR 1,200,000', 1200000],
    ['₨ 500', 500],
    ['රු. 7,500', 7500],
    ['ரூ 7,500', 7500],
    ['45,000/-', 45000],
    ['Rs. 45,000/-', 45000],
    ['1 234 567', 1234567],
    ['1 234 567', 1234567], // non-breaking spaces, as pasted from a PDF
    ['1 234 567', 1234567], // narrow no-break space, as some Intl builds emit
    ['  450000  ', 450000],
    ['0007', 7],
    ['12,34,567', 1234567], // lakh-style grouping: separators are noise, not syntax
    ['12,34', 1234], // malformed grouping is still an amount
  ])('%j → %i', (raw, expected) => {
    expect(parseRupees(raw)).toEqual({ ok: true, value: expected });
  });
});

describe('strict storage — what is refused, and why', () => {
  it.each([
    ['12.50', 'decimal'],
    ['45,000.00', 'decimal'], // exact, but still a silent rewrite if accepted
    ['0.5', 'decimal'],
    ['1.2.3', 'decimal'],
    ['Rs. 1,234.99', 'decimal'],
    ['-1', 'negative'],
    ['-45,000', 'negative'],
    ['−5000', 'negative'], // U+2212 true minus, as pasted from a document
    ['abc', 'not-a-number'],
    ['45000x', 'not-a-number'],
    ['1e6', 'not-a-number'], // exponent notation is not an amount someone declares
    ['٤٥', 'not-a-number'], // Arabic-Indic digits
    ['9007199254740992', 'too-large'], // 2^53: the first integer JS cannot hold exactly
  ] as const)('%j is refused as %s', (raw, code) => {
    const result = parseRupees(raw);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, code });
  });

  it('9007199254740991 (2^53 - 1) is still accepted exactly', () => {
    expect(parseRupees('9007199254740991')).toEqual({
      ok: true,
      value: Number.MAX_SAFE_INTEGER,
    });
  });

  it('every refusal carries a non-empty message that explains the rule', () => {
    for (const message of Object.values(CURRENCY_MESSAGES)) {
      expect(message.length).toBeGreaterThan(40);
      // A message that only says "invalid" tells the user nothing they can act
      // on. Each one has to name what to type instead.
      expect(message).toMatch(/Enter|enter/);
    }
  });

  it('a refusal never carries a value, so no figure can leak from a rejected entry', () => {
    for (const raw of ['12.50', '-1', 'abc', '9007199254740992']) {
      const result = parseRupees(raw);
      expect(result).not.toHaveProperty('value');
    }
  });
});

describe('display formatting — one way only, out of the model', () => {
  it.each([
    [null, ''],
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [1000, '1,000'],
    [45000, '45,000'],
    [1234567, '1,234,567'],
    [1000000000, '1,000,000,000'],
  ])('formatRupees(%j) → %j', (value, expected) => {
    expect(formatRupees(value)).toBe(expected);
  });

  it('formatRupees(null) is empty, never "Rs. 0"', () => {
    expect(formatRupees(null)).toBe('');
    expect(formatRupeesWithUnit(null)).toBe('');
  });

  it('formatRupeesWithUnit carries the unit for a standalone figure', () => {
    expect(formatRupeesWithUnit(1234567)).toBe('Rs. 1,234,567');
  });

  it('grouping is fixed three-digit, independent of the runtime ICU build', () => {
    // If this ever became Intl-backed, an ICU build grouping en-LK in lakhs
    // would produce 12,34,567 here and the failure would be invisible in review.
    expect(groupDigits('1234567')).toBe('1,234,567');
    expect(groupDigits('12')).toBe('12');
    expect(groupDigits('')).toBe('');
  });

  it('round-trips: a formatted figure parses back to the same integer', () => {
    for (const value of [0, 1, 999, 1000, 45000, 1234567, 987654321]) {
      expect(parseRupees(formatRupees(value))).toEqual({ ok: true, value });
      expect(parseRupees(formatRupeesWithUnit(value))).toEqual({ ok: true, value });
    }
  });
});

describe('separators appear while typing', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '123'],
    ['1234', '1,234'],
    ['1234567', '1,234,567'],
    ['1,234', '1,234'], // already grouped: idempotent
    ['1,2,3,4', '1,234'], // regrouped from the digits, not from the commas
    ['Rs. 45000', '45,000'], // the prefix is stripped as it is pasted
    ['45,000/-', '45,000'],
  ])('displayForTyping(%j) → %j', (raw, expected) => {
    expect(displayForTyping(raw)).toBe(expected);
  });

  it('echoes a half-typed decimal back unchanged rather than eating the point', () => {
    // Validation happens on blur. Rewriting "12." to "12" mid-keystroke would
    // fight the user while they are still typing, and would hide the fact that
    // the entry is about to be refused.
    expect(displayForTyping('12.')).toBe('12.');
    expect(displayForTyping('12.5')).toBe('12.5');
    expect(displayForTyping('1234.5')).toBe('1234.5');
  });

  it('echoes other unparseable entries back rather than silently dropping them', () => {
    expect(displayForTyping('abc')).toBe('abc');
    expect(displayForTyping('-5')).toBe('-5');
  });

  it('is idempotent — reformatting its own output changes nothing', () => {
    for (const raw of ['', '1', '1234', '1,234,567', '12.5', 'abc']) {
      expect(displayForTyping(displayForTyping(raw))).toBe(displayForTyping(raw));
    }
  });
});

describe('caret position survives regrouping', () => {
  it('keeps the caret after the digit just typed when a comma is inserted', () => {
    // The user has "123", types "4" at the end → raw "1234", caret 4.
    // Display becomes "1,234"; the caret belongs at the end, offset 5.
    expect(caretAfterFormat('1234', 4, '1,234')).toBe(5);
  });

  it('keeps the caret in place when typing into the middle of a grouped figure', () => {
    // "1,234,567" with the caret after the "4" (offset 6); the user types "9"
    // → raw "1,2349,567", caret 7, five significant digits before it.
    // Display regroups to "12,349,567"; the caret belongs after the "9".
    expect(caretAfterFormat('1,2349,567', 7, '12,349,567')).toBe(6);
    expect('12,349,567'.slice(0, 6)).toBe('12,349');
  });

  it('puts the caret at the start when there is nothing before it', () => {
    expect(caretAfterFormat('1234', 0, '1,234')).toBe(0);
  });

  it('never returns an offset outside the displayed string', () => {
    for (const [raw, caret, display] of [
      ['1234', 99, '1,234'],
      ['', 0, ''],
      ['1,234,567', 9, '1,234,567'],
    ] as const) {
      const result = caretAfterFormat(raw, caret, display);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(display.length);
    }
  });
});

describe('structural properties', () => {
  it('no successful parse ever produces a float', () => {
    const inputs = [
      '',
      '0',
      '1',
      '999',
      '1,234,567',
      'Rs. 45,000',
      '  450000  ',
      '9007199254740991',
      '12.50',
      '-1',
      'abc',
    ];
    for (const raw of inputs) {
      const result = parseRupees(raw);
      if (result.ok && result.value !== null) {
        expect(Number.isInteger(result.value)).toBe(true);
        expect(Number.isSafeInteger(result.value)).toBe(true);
      }
    }
  });

  it('stripCurrencyNoise leaves the significant characters alone', () => {
    expect(stripCurrencyNoise('Rs. 1,234.50')).toBe('1234.50');
    expect(stripCurrencyNoise('abc')).toBe('abc');
  });
});

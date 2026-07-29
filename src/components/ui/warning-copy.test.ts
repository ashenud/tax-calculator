/**
 * The warning-code wording table, checked against **both** sources of codes.
 *
 * `docs/spec/ui-behaviour.md` names one set of codes; `src/lib/tax/engine.ts`
 * emits a partly different one. See the long note at the head of
 * `warning-copy.ts`. Neither set is allowed to lose an entry silently, so:
 *
 *   - the engine's set is read **from the engine**, so a code added there
 *     without wording here fails this suite rather than reaching a user as a
 *     bare hyphenated string;
 *   - the spec's set is written out below with the section it comes from,
 *     because a spec table cannot be imported and the alternative is trusting
 *     that somebody re-read it.
 */

import { describe, expect, it } from 'vitest';
import { REFUSAL_CODES, WARNING_CODES } from '../../lib/tax/engine.ts';
import { UI_REFUSAL_CODES, hasRefusalCopy, refusalCopy } from './RefusalPanel.tsx';
import {
  SEVERITY_LABEL,
  SEVERITY_RANK,
  SEVERITY_TONE,
  UI_WARNING_CODES,
  UNKNOWN_WARNING_COPY,
  hasWarningCopy,
  warningCopy,
} from './warning-copy.ts';

/**
 * `docs/spec/ui-behaviour.md`, "Warnings the UI must be able to render".
 * Normative for the codes it names, whether or not anything emits them yet.
 */
const SPEC_WARNING_CODES = [
  'unverified-rate',
  'stale-law',
  'condition-not-met',
  'condition-unresolved',
  'excess-credit',
  'proposed-year',
  'late-instalment',
] as const;

describe('every warning code has user-facing wording', () => {
  it.each(Object.values(WARNING_CODES))(
    'the engine code %s has wording of its own',
    (code) => {
      expect(
        hasWarningCopy(code),
        `engine WARNING_CODES contains "${code}" but warning-copy.ts has no entry for it. ` +
          'A user would be shown generic wording instead of an explanation written for this case.',
      ).toBe(true);
    },
  );

  it.each(SPEC_WARNING_CODES)(
    'the ui-behaviour.md code %s has wording of its own',
    (code) => {
      expect(hasWarningCopy(code)).toBe(true);
    },
  );

  it('carries every code from both sets, and the sets really do differ', () => {
    const engine = new Set<string>(Object.values(WARNING_CODES));
    const spec = new Set<string>(SPEC_WARNING_CODES);

    // The discrepancy this suite exists to hold in place. If these ever line
    // up, ui-behaviour.md's table has been reconciled with the engine and the
    // note at the head of warning-copy.ts should be revisited.
    const inSpecOnly = [...spec].filter((code) => !engine.has(code));
    const inEngineOnly = [...engine].filter((code) => !spec.has(code));
    expect(inSpecOnly).toEqual([
      'stale-law',
      'condition-not-met',
      'condition-unresolved',
      'proposed-year',
      'late-instalment',
    ]);
    expect(inEngineOnly.length).toBeGreaterThan(0);

    for (const code of [...spec, ...engine]) expect(hasWarningCopy(code)).toBe(true);
  });

  it('spells the UI-only codes exactly as ui-behaviour.md does', () => {
    for (const code of Object.values(UI_WARNING_CODES)) {
      expect(SPEC_WARNING_CODES as readonly string[]).toContain(code);
    }
  });
});

describe('an unrecognised code still renders', () => {
  it('falls back rather than throwing or returning undefined', () => {
    const copy = warningCopy('a-code-invented-by-a-future-engine');
    expect(copy).toBe(UNKNOWN_WARNING_COPY);
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.meaning.length).toBeGreaterThan(0);
  });

  it('reports it as having no wording of its own', () => {
    expect(hasWarningCopy('a-code-invented-by-a-future-engine')).toBe(false);
  });
});

describe('severity is expressible without colour', () => {
  it.each(['blocking', 'warn', 'info'] as const)(
    '%s has a label in words',
    (severity) => {
      expect(SEVERITY_LABEL[severity]).toBeTruthy();
      expect(SEVERITY_TONE[severity]).toBeTruthy();
      expect(SEVERITY_RANK[severity]).toBeTypeOf('number');
    },
  );

  it('ranks blocking above warn above info', () => {
    expect(SEVERITY_RANK['blocking']!).toBeLessThan(SEVERITY_RANK['warn']!);
    expect(SEVERITY_RANK['warn']!).toBeLessThan(SEVERITY_RANK['info']!);
  });
});

describe('every refusal code has user-facing wording', () => {
  it.each(Object.values(REFUSAL_CODES))('the engine refusal %s', (code) => {
    expect(
      hasRefusalCopy(code),
      `engine REFUSAL_CODES contains "${code}" but RefusalPanel.tsx has no wording for it.`,
    ).toBe(true);
  });

  it.each(Object.values(UI_REFUSAL_CODES))('the UI refusal %s', (code) => {
    expect(hasRefusalCopy(code)).toBe(true);
  });

  it('falls back for an unrecognised refusal rather than dropping it', () => {
    const copy = refusalCopy('something-new');
    expect(copy.title).toContain('not going to guess');
    expect(copy.meaning.length).toBeGreaterThan(0);
    expect(copy.whatWouldSettleIt.length).toBeGreaterThan(0);
  });
});

describe('the wording states no figure of its own', () => {
  // CLAUDE.md rule 1 and the "UI never computes" rule. Every amount and every
  // rate a user sees comes from `TaxResult`; the wording here describes what
  // happened to their figure, and the engine's own message carries the numbers
  // and the citation. A digit in this table would be a figure with no fixture
  // behind it.
  const codes = [
    ...Object.values(WARNING_CODES),
    ...Object.values(UI_WARNING_CODES),
  ] as string[];

  it.each(codes)('%s carries no rupee amount, percentage or bare number', (code) => {
    const text = `${warningCopy(code).title} ${warningCopy(code).meaning}`;
    expect(text).not.toMatch(/\d/);
  });

  it.each([...Object.values(REFUSAL_CODES), ...Object.values(UI_REFUSAL_CODES)])(
    '%s carries no figure either',
    (code) => {
      const copy = refusalCopy(code);
      expect(`${copy.title} ${copy.meaning} ${copy.whatWouldSettleIt}`).not.toMatch(/\d/);
    },
  );
});

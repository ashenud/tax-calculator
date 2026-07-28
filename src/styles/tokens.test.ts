/**
 * Accessibility floor, measured — not asserted.
 *
 * `docs/spec/ui-design-system.md` requires >= 4.5:1 for body text and >= 3:1 for
 * large text and UI boundaries, **in both themes**. ADR-0003 makes several of
 * these elements load-bearing content rather than chrome, so a contrast
 * regression here is a correctness bug, not a polish item.
 *
 * This suite parses the shipped `global.css` and computes the real ratios. It
 * is deliberately not a snapshot of hand-measured numbers: if someone nudges a
 * colour in six months, this fails rather than the report going stale.
 *
 * If a pair below fails, the fix is the colour. It is never the threshold.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, isOutOfSrgbGamut, parseOklch, toHex } from '../lib/oklch.ts';

const CSS = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

/** WCAG 2.2 thresholds. These are floors. They do not move. */
const AA_BODY = 4.5;
const AA_LARGE_AND_UI = 3;

type Tokens = Record<string, string>;

/**
 * Pull `--color-*: oklch(...)` declarations out of one brace-delimited block,
 * located by the text that opens it.
 */
function extractBlock(openedBy: string, occurrence = 0): Tokens {
  let searchFrom = 0;
  for (let i = 0; i <= occurrence; i += 1) {
    const found = CSS.indexOf(openedBy, searchFrom);
    if (found === -1) {
      throw new Error(
        `global.css no longer contains block ${occurrence} of "${openedBy}"`,
      );
    }
    searchFrom = found + openedBy.length;
  }

  // Walk braces from the block opener so a nested @media does not end it early.
  const start = CSS.indexOf('{', searchFrom);
  let depth = 0;
  let end = start;
  for (let i = start; i < CSS.length; i += 1) {
    if (CSS[i] === '{') depth += 1;
    if (CSS[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const tokens: Tokens = {};
  const body = CSS.slice(start, end);
  for (const match of body.matchAll(/(--color-[a-z-]+):\s*(oklch\([^)]*\))\s*;/g)) {
    tokens[match[1]!] = match[2]!;
  }
  return tokens;
}

const light = extractBlock('@theme');
const darkMedia = extractBlock(":root:not([data-theme='light'])");
const darkExplicit = extractBlock(":root[data-theme='dark']");

function ratio(themeTokens: Tokens, foreground: string, background: string): number {
  const fg = themeTokens[foreground];
  const bg = themeTokens[background];
  if (!fg) throw new Error(`missing token ${foreground}`);
  if (!bg) throw new Error(`missing token ${background}`);
  return contrastRatio(parseOklch(fg), parseOklch(bg));
}

/**
 * Every pair that has a contrast obligation, and which obligation.
 *
 * `body` pairs are text a user reads at 17px. `ui` pairs are boundaries,
 * markers and icons — WCAG 1.4.11 — plus the focus indicator, which must be
 * findable against whatever it surrounds.
 */
interface Pair {
  fg: string;
  bg: string;
  floor: number;
  why: string;
}

// Every status colour carries the same four obligations. ADR-0003 puts real
// weight on these: danger renders a refusal, caution an unverified figure.
const statusPairs = (['danger', 'caution', 'positive', 'info'] as const).flatMap(
  (status): Pair[] => [
    {
      fg: `--color-${status}`,
      bg: '--color-surface',
      floor: AA_LARGE_AND_UI,
      why: `the ${status} icon or marker on the page`,
    },
    {
      fg: `--color-${status}-strong`,
      bg: '--color-surface',
      floor: AA_BODY,
      why: `${status} text on the page`,
    },
    {
      fg: `--color-${status}-strong`,
      bg: `--color-${status}-subtle`,
      floor: AA_BODY,
      why: `${status} text inside its own notice`,
    },
    {
      fg: '--color-text',
      bg: `--color-${status}-subtle`,
      floor: AA_BODY,
      why: `ordinary copy inside a ${status} notice`,
    },
  ],
);

const PAIRS: readonly Pair[] = [
  // --- Body text ---------------------------------------------------------
  {
    fg: '--color-text',
    bg: '--color-surface',
    floor: AA_BODY,
    why: 'body copy on the page',
  },
  {
    fg: '--color-text',
    bg: '--color-surface-raised',
    floor: AA_BODY,
    why: 'body copy in a card',
  },
  {
    fg: '--color-text',
    bg: '--color-surface-sunken',
    floor: AA_BODY,
    why: 'body copy in a well',
  },
  {
    fg: '--color-text-muted',
    bg: '--color-surface',
    floor: AA_BODY,
    why: 'the as-at stamp and other secondary text — secondary is still read',
  },
  {
    fg: '--color-text-muted',
    bg: '--color-surface-raised',
    floor: AA_BODY,
    why: 'secondary text in a card',
  },

  // --- Links and controls ------------------------------------------------
  { fg: '--color-accent', bg: '--color-surface', floor: AA_BODY, why: 'link text' },
  {
    fg: '--color-accent',
    bg: '--color-surface-raised',
    floor: AA_BODY,
    why: 'link text in a card',
  },
  {
    fg: '--color-accent-hover',
    bg: '--color-surface',
    floor: AA_BODY,
    why: 'hovered link text',
  },
  {
    fg: '--color-accent-contrast',
    bg: '--color-accent',
    floor: AA_BODY,
    why: 'the label on a primary button',
  },

  // --- Boundaries and the focus ring -------------------------------------
  {
    fg: '--color-border-strong',
    bg: '--color-surface',
    floor: AA_LARGE_AND_UI,
    why: 'the outline of an input the user has to find',
  },
  {
    fg: '--color-border-strong',
    bg: '--color-surface-raised',
    floor: AA_LARGE_AND_UI,
    why: 'the outline of an input inside a card',
  },
  {
    fg: '--color-focus',
    bg: '--color-surface',
    floor: AA_LARGE_AND_UI,
    why: 'the focus ring against the page',
  },
  {
    fg: '--color-focus',
    bg: '--color-surface-raised',
    floor: AA_LARGE_AND_UI,
    why: 'the focus ring against a card',
  },

  ...statusPairs,
];

const THEMES = [
  { name: 'light', tokens: light },
  { name: 'dark', tokens: { ...light, ...darkExplicit } },
] as const;

describe.each(THEMES)('$name theme contrast (WCAG 2.2 AA)', ({ tokens }) => {
  it.each(PAIRS)('$fg on $bg >= $floor:1 — $why', ({ fg, bg, floor }) => {
    const measured = ratio(tokens, fg, bg);
    expect(
      measured,
      `${fg} (${toHex(parseOklch(tokens[fg]!))}) on ${bg} ` +
        `(${toHex(parseOklch(tokens[bg]!))}) measured ${measured.toFixed(2)}:1, ` +
        `floor ${floor}:1. Fix the colour, never the floor.`,
    ).toBeGreaterThanOrEqual(floor);
  });
});

describe('token hygiene', () => {
  it('declares every colour token in both themes', () => {
    // A token defined only in light silently keeps its light value in dark,
    // which is how a dark-mode contrast failure gets shipped unnoticed.
    expect(Object.keys(darkExplicit).sort()).toEqual(Object.keys(light).sort());
  });

  it('keeps the two dark blocks in sync', () => {
    // Plain CSS cannot share a declaration list between a media query and a
    // selector, so the dark palette is written twice. This is the guard that
    // makes that duplication safe.
    expect(darkMedia).toEqual(darkExplicit);
  });

  it.each(THEMES)('$name: every colour is inside the sRGB gamut', ({ tokens }) => {
    // An out-of-gamut oklch() is clipped per channel by the compositor, which
    // shifts the hue and the contrast ratio away from what was authored.
    const clipped = Object.entries(tokens)
      .filter(([, value]) => isOutOfSrgbGamut(parseOklch(value)))
      .map(
        ([name, value]) => `${name}: ${value} -> clipped to ${toHex(parseOklch(value))}`,
      );
    expect(clipped).toEqual([]);
  });

  it('uses semantic colour names, never literal ones', () => {
    const literals = Object.keys(light).filter((name) =>
      /--color-(red|green|blue|yellow|orange|grey|gray|purple|pink|teal)\b/.test(name),
    );
    expect(literals).toEqual([]);
  });
});

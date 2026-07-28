# UI design system

> **Status:** spec — no code exists yet
> **Related:** [`ui-behaviour.md`](ui-behaviour.md), [`site-architecture.md`](site-architecture.md), [`../decisions/adr-0003-disclaimer-and-liability-posture.md`](../decisions/adr-0003-disclaimer-and-liability-posture.md)

## What this interface is for

Someone is working out what they owe the Inland Revenue Department, often for the first
time, often anxious, frequently on a phone with a poor connection. The design brief is
**calm, legible, and checkable** — not impressive.

Two consequences that override normal aesthetic preference:

- **Density loses to clarity.** A dashboard packed with figures is the wrong shape. One
  question at a time, generous spacing, large type for numbers that matter.
- **Nothing may hide.** Disclaimers, warnings and refusals are load-bearing content, not
  chrome to be tucked away. Any pattern that collapses them (accordions, toasts, tooltips
  as the only carrier) is prohibited by ADR-0003.

## Stack

Versions below are **as actually installed at P00**, not aspirational.

| Layer | Choice | Note |
|---|---|---|
| Framework | **Astro 7.1.4** | static output; guidance pages ship zero JS |
| Islands | **React 19.2.8** via `@astrojs/react` 6.0.1 | only the calculator hydrates |
| Styling | **Tailwind CSS 4.3.3** | CSS-first config via `@theme` |
| Integration | **`@tailwindcss/vite` 4.3.3** | see below — `@astrojs/tailwind` is doubly unusable |
| Language | **TypeScript 6.0.3** | **not 7.x** — see below |
| Tests | **Vitest 4.1.10** | `passWithNoTests` until P04 |
| Lint/format | ESLint 10.8.0, typescript-eslint 8.65.0, Prettier 3.9.6 | |
| Primitives | **Radix UI** | headless, accessible; we style them |
| Icons | **Lucide** | tree-shakeable |
| Fonts | system stack for prose + **`@fontsource-variable/inter` 5.3.0** for figures, self-hosted | no external font CDN — CSP and offline. Latin subset only, 48 KB, `font-display: swap`. Prose stays on the system stack so first paint never waits on a download. |

### Two constraints found by installing, not by reading

**`@astrojs/tailwind` cannot be used.** It peers `astro: ^3 || ^4 || ^5` *and*
`tailwindcss: ^3.0.24` — so it supports neither our Astro nor our Tailwind. This is a
harder fact than the earlier draft of this spec claimed. `@tailwindcss/vite` peers
`vite: ^5.2 || ^6 || ^7 || ^8`, and Astro 7 ships Vite `^8`, so it is compatible.

**TypeScript is pinned below 7.** `npm install` hard-fails on 7.x: `@astrojs/check` peers
`typescript: ^5 || ^6`, and typescript-eslint peers `>=4.8.4 <6.1.0`. Latest 6.x installs
clean. Revisit when `@astrojs/check` supports 7.

`eslint-plugin-jsx-a11y` is **not installed** — its latest peers `eslint: ^3…^9` and blocks
ESLint 10. It is a `peerOptional` of `eslint-plugin-astro`, so dropping it resolved the
conflict without downgrading ESLint. Accessibility linting is P15's scope; this is a gap to
close there, not a decision to leave unexamined.

> An earlier version of this spec named Astro 6 and was already stale within hours of being
> written. Confirm current stable before scaffolding rather than trusting these numbers —
> and when they change, update this table from what installed.

### Two operational notes for CI

- Node must be **≥ 22.22.3**; `eslint-plugin-astro` emits an EBADENGINE warning below that.
- **Astro telemetry is on by default.** Given this project's "nothing leaves the browser"
  posture, set `ASTRO_TELEMETRY_DISABLED=1` in CI (P16). It was not disabled locally because
  that writes to global user config outside the repo.

## Tokens

CSS custom properties under Tailwind v4's `@theme`. **Components never hardcode a colour
or a size** — every value resolves to a token, so a theme change is one file.

### Colour

Semantic names, not literal ones. `--color-danger` survives a palette change; `--color-red`
does not.

The authority for the palette is `src/styles/global.css`. The sketch below is the shape
of it; the values there are the ones that shipped, and they differ slightly from this
draft because they were measured (see "Two constraints found by measuring", below).

```css
@theme {
  --color-surface:        oklch(99% 0.002 260);
  --color-surface-raised: oklch(100% 0 0);
  --color-surface-sunken: oklch(96.5% 0.004 260);

  --color-border:         oklch(91% 0.005 260);   /* decorative rule only */
  --color-border-strong:  oklch(63% 0.012 260);   /* UI component boundary */

  --color-text:           oklch(25% 0.01 260);
  --color-text-muted:     oklch(50% 0.012 260);

  --color-accent:         oklch(50% 0.142 250);   /* interactive, links */
  --color-accent-contrast: oklch(100% 0 0);
  --color-focus:          oklch(50% 0.142 250);   /* the focus ring */

  --color-danger:         oklch(52% 0.19 27);     /* blocking refusal */
  --color-caution:        oklch(62% 0.131 75);    /* unverified figure, unmet condition */
  --color-positive:       oklch(52% 0.115 155);   /* nothing owed, condition met */
  --color-info:           oklch(52% 0.09 230);
}
```

Each status colour has three roles, and they are **not** interchangeable:

| Role | Token | Floor |
|---|---|---|
| icon, marker, border | `--color-<status>` | ≥ 3:1 on surface |
| text | `--color-<status>-strong` | ≥ 4.5:1 on surface *and* on `-subtle` |
| notice background | `--color-<status>-subtle` | the fill behind `-strong` |

**Dark mode** via `@media (prefers-color-scheme: dark)` plus a `:root[data-theme]`
override so an explicit toggle wins in both directions. Both themes must pass contrast —
dark mode is not a filter over the light palette.

### Two constraints found by measuring, not by choosing

Both were found in P01 by computing the ratios rather than eyeballing the swatches.

**A status colour cannot carry its own body text.** `--color-caution` measures **3.62:1**
on `--color-surface` — fine for an icon or a rule, below the 4.5:1 floor for text. This is
why the `-strong` variant exists and why "just use `--color-caution` for the warning copy"
is wrong. `WarningList` and `UnverifiedBadge` (P09) must use `-strong` for text.

**`--color-border` cannot be a control outline.** At **1.31:1** it is a divider and
nothing more. Anything WCAG 1.4.11 counts as a UI component boundary — an input outline, a
checkbox edge, the border of a control a user has to find — takes `--color-border-strong`
(**3.42:1** light, **3.58:1** dark). `CurrencyField` (P08) depends on this.

Every pair with a contrast obligation is measured in `src/styles/tokens.test.ts`, in both
themes, on every commit. When a colour changes, the fix is the colour and never the floor.
`src/lib/oklch.ts` does the OKLCH → sRGB and WCAG luminance maths; it is test-only and is
not shipped to the browser. The same suite asserts that no token falls outside the sRGB
gamut, because an out-of-gamut `oklch()` is clipped per channel by the compositor, which
silently moves the ratio away from the one that was specified.

### Type

A calculator has exactly two typographic jobs: prose that must be readable at length, and
numbers that must be scannable and comparable.

```css
@theme {
  --font-sans: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-numeric: "Inter Variable", ui-sans-serif, system-ui, sans-serif;

  --text-xs: 0.8125rem;  --text-sm: 0.9375rem;  --text-base: 1.0625rem;
  --text-lg: 1.25rem;    --text-xl: 1.5rem;     --text-2xl: 2rem;  --text-3xl: 2.75rem;
}
```

Body copy sits at `--text-base` (17px), deliberately above the 16px default: guidance
pages carry long legal explanation and are read on phones.

**Every rupee figure uses `font-variant-numeric: tabular-nums`.** Without it, digits in a
computation table do not align vertically and the working becomes hard to check — which is
the one thing this tool promises.

Line length is capped at `65ch` for prose. Sinhala and Tamil script have taller ascenders
and need `line-height: 1.7` minimum; do not tune leading against Latin text alone.

### Spacing and radii

A 4px base scale. Radii: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`.
Cards and inputs at `md`; the result panel at `lg`.

## Layout

**Mobile-first, single column to 768px.** A large share of users are phone-only. The
calculator is a vertical flow, never a side-by-side form/preview split on small screens.

Above 1024px the calculator moves to a two-column layout: inputs left, a **sticky result
panel** right. The result panel is the reason for the layout — a user changing an input
should see the number move without scrolling.

**Container queries, not viewport queries**, for components that appear in more than one
context (the result panel renders both in the sticky column and full-width on mobile).

Page shell: `max-width: 72rem`, gutters `1rem` mobile / `2rem` desktop.

## Component inventory

Grouped by whether the design is free or constrained by ADR-0003.

### Constrained — these have required behaviour

| Component | Requirement |
|---|---|
| `Disclaimer` | Base layout, every page. Not dismissible, not a footer link. |
| `AsAtStamp` | Adjacent to every computed figure. Carries Y/A and data review date. |
| `WarningList` | Above the result, expanded. Never an accordion. |
| `RefusalPanel` | Replaces the figure entirely. Explains what is unresolved and why no number is given. |
| `CitationRef` | Renders a `src` pointer; links to the sources page. Present on every displayed rate. |
| `UnverifiedBadge` | On any figure whose data carries `verified: false`. |
| `YearSelector` | Always visible, never defaulted from the clock. |

### Free — ordinary components

`Button`, `TextField`, `CurrencyField`, `RadioCardGroup`, `Select`, `Callout`, `Card`,
`Table`, `Stepper`, `ProgressIndicator`, `Tabs`, `Skeleton`, `PersonaCard`.

### `CurrencyField` deserves its own note

Money entry is where calculators lose people.

- `inputmode="numeric"`, not `type="number"` — spinners and scroll-to-change are hazards
  on a tax form
- Thousands separators shown while typing, stripped on parse
- The parsed **integer rupee value** is what leaves the component; formatting never
  re-enters the model
- Empty is not zero. An untouched field is `null` and the UI must not treat it as a
  declared nil

## Accessibility

Target **WCAG 2.2 AA**, and treat it as a floor.

- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries — **in both themes**
- Visible focus ring, 2px, `--color-accent`, never removed
- Touch targets ≥ 44×44px
- Every input has a real `<label>`; placeholders are never labels
- Errors linked with `aria-describedby`; the summary is focusable and focused on submit
- Result updates announced via `aria-live="polite"`; refusals via `role="alert"`
- Full keyboard operation, logical tab order, skip link
- `prefers-reduced-motion` honoured — all transitions become instant
- Never colour alone: every status carries an icon and text

## Motion

Sparingly. 150ms for state changes, 250ms for panel entry, standard ease-out. The result
figure animates **not at all** — a number that counts up is charming in a marketing page
and undermines trust in a tax figure.

## Print

A real requirement, not an afterthought: people take a printout to their practitioner.

Print stylesheet drops navigation and interactive chrome, keeps the full computation
breakdown with citations, and **keeps the disclaimer and the as-at stamp**. A printed
result without its provenance is exactly the artefact ADR-0003 is trying to prevent.

## Prohibited

Each of these is a plausible improvement that would quietly undo ADR-0003:

- Collapsing warnings, refusals or the disclaimer behind a disclosure
- Toasts as the only carrier for a warning — they disappear
- Tooltips as the only carrier for a citation — unreachable on touch
- Animating or counting up a tax figure
- Any "optimise my tax" affordance
- Styling output to resemble an official IRD form
- A dense dashboard that presents a single total without the working

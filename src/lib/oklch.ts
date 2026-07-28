/**
 * OKLCH -> sRGB conversion and WCAG 2.x relative-luminance / contrast maths.
 *
 * This module exists for one reason: to make the accessibility floor in
 * `docs/spec/ui-design-system.md` (>= 4.5:1 body text, >= 3:1 UI boundaries, in
 * BOTH themes) a thing CI checks on every commit rather than a thing somebody
 * measured once with a browser extension and then wrote "passes" in a report.
 *
 * It is NOT runtime code. Nothing in `src/pages` or `src/components` imports it;
 * the browser gets the oklch() values from `src/styles/global.css` directly.
 * It is consumed only by `src/styles/tokens.test.ts`.
 *
 * Conversion follows Björn Ottosson's Oklab reference implementation and the
 * CSS Color Level 4 definition of oklch(). WCAG contrast follows WCAG 2.2
 * definition of relative luminance, computed on the *gamut-clipped 8-bit sRGB*
 * value, because that is what a display actually emits and therefore what a
 * user actually sees.
 */

export interface Oklch {
  /** Lightness, 0..1 (a `50%` literal is 0.5). */
  readonly l: number;
  /** Chroma, absolute (not a percentage). */
  readonly c: number;
  /** Hue in degrees. */
  readonly h: number;
}

export interface Rgb8 {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Parse the subset of `oklch()` syntax this codebase uses:
 *   oklch(52% 0.16 250)   oklch(100% 0 0)   oklch(0.52 0.16 250)
 * Deliberately strict — an unparseable token should fail loudly in the test
 * rather than silently score as black.
 */
export function parseOklch(input: string): Oklch {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i.exec(
    input.trim(),
  );
  if (!match) {
    throw new Error(`Not a supported oklch() colour: ${JSON.stringify(input)}`);
  }
  const [, rawL, pct, rawC, rawH] = match as unknown as [
    string,
    string,
    string,
    string,
    string,
  ];
  const l = Number(rawL) / (pct === '%' ? 100 : 1);
  return { l, c: Number(rawC), h: Number(rawH) };
}

/** Gamma-encode one linear-light sRGB channel (CSS Color 4 / IEC 61966-2-1). */
function encodeGamma(channel: number): number {
  const abs = Math.abs(channel);
  const encoded =
    abs <= 0.0031308
      ? channel * 12.92
      : Math.sign(channel) * (1.055 * abs ** (1 / 2.4) - 0.055);
  return encoded;
}

/** Inverse of {@link encodeGamma}: 0..1 gamma-encoded channel -> linear light. */
function decodeGamma(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Oklch -> linear-light sRGB. Values may fall outside 0..1 (out of gamut). */
function oklchToLinearSrgb(colour: Oklch): [number, number, number] {
  const hueRadians = (colour.h * Math.PI) / 180;
  const a = colour.c * Math.cos(hueRadians);
  const b = colour.c * Math.sin(hueRadians);

  const lPrime = colour.l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = colour.l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = colour.l - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = lPrime ** 3;
  const mCubed = mPrime ** 3;
  const sCubed = sPrime ** 3;

  return [
    4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed,
    -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed,
    -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed,
  ];
}

/**
 * Oklch -> 8-bit sRGB, clipped to gamut.
 *
 * Clipping (rather than gamut-mapping by reducing chroma) matches what the
 * measurement is for: we want the luminance of the pixel that is actually lit,
 * and an out-of-gamut oklch() is clipped per channel by the compositor.
 */
export function oklchToRgb8(colour: Oklch): Rgb8 {
  const [rLin, gLin, bLin] = oklchToLinearSrgb(colour);
  const to8 = (linear: number): number =>
    Math.round(Math.min(1, Math.max(0, encodeGamma(linear))) * 255);
  return { r: to8(rLin), g: to8(gLin), b: to8(bLin) };
}

/** True when the colour falls outside the sRGB gamut and will be clipped. */
export function isOutOfSrgbGamut(colour: Oklch, tolerance = 0.001): boolean {
  return oklchToLinearSrgb(colour).some(
    (channel) => channel < -tolerance || channel > 1 + tolerance,
  );
}

/** WCAG 2.2 relative luminance of an 8-bit sRGB colour. */
export function relativeLuminance(rgb: Rgb8): number {
  const r = decodeGamma(rgb.r / 255);
  const g = decodeGamma(rgb.g / 255);
  const b = decodeGamma(rgb.b / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio between two colours. Range 1..21. */
export function contrastRatio(foreground: Oklch, background: Oklch): number {
  const lighter = Math.max(
    relativeLuminance(oklchToRgb8(foreground)),
    relativeLuminance(oklchToRgb8(background)),
  );
  const darker = Math.min(
    relativeLuminance(oklchToRgb8(foreground)),
    relativeLuminance(oklchToRgb8(background)),
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** `#rrggbb`, for reporting a measured colour in human-checkable form. */
export function toHex(colour: Oklch): string {
  const { r, g, b } = oklchToRgb8(colour);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

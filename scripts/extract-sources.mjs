#!/usr/bin/env node
/**
 * Extract text from the primary-source PDFs in docs/sources/ into
 * docs/sources/text/<name>.txt.
 *
 * WHY THIS EXISTS: `tax-rule-verifier` works with Read and Grep. Without a text
 * form of the acts it cannot search them, and a verifier that cannot search the
 * legislation is decorative. The extracted text is what makes grep-based
 * verification possible at all.
 *
 * THE PDF REMAINS AUTHORITATIVE. Extraction is lossy — ligatures collapse, table
 * layout is destroyed, and some fonts decode to nothing. A quote taken from the
 * text MUST be checked against the PDF before it is used as evidence for a
 * `verified` verdict. See docs/sources/README.md.
 *
 * Dependency-free: uses zlib, which is enough for FlateDecode content streams.
 * Scanned PDFs (no embedded fonts) produce no text and are reported as such —
 * they need OCR, which is out of scope here.
 *
 * Usage:  node scripts/extract-sources.mjs [--check]
 *         --check  verify extracted text is present and non-trivial; exit 1 if not
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'docs/sources');
const OUT_DIR = join(SRC_DIR, 'text');
const CHECK = process.argv.includes('--check');

/** Below this, treat the PDF as image-only — it needs OCR, not extraction. */
const MIN_USEFUL_CHARS = 2000;

/**
 * Pull text-showing operators out of a PDF's FlateDecode content streams.
 * Handles the (literal string) form used by Tj/TJ; that covers the IRD and
 * parliament documents this repo holds.
 */
function extractText(buf) {
  const parts = [];
  const streamRe = /stream\r?\n/g;
  let m;

  while ((m = streamRe.exec(buf.toString('latin1'))) !== null) {
    const start = m.index + m[0].length;
    const end = buf.indexOf('endstream', start, 'latin1');
    if (end < 0) continue;

    let dec;
    try {
      dec = inflateSync(buf.subarray(start, end));
    } catch {
      continue; // not FlateDecode, or an image stream
    }

    const s = dec.toString('latin1');
    if (!s.includes('Tj') && !s.includes('TJ')) continue;

    // Literal strings: ( ... ) with \( \) \\ escapes
    for (const t of s.matchAll(/\((?:\\.|[^\\()])*\)/g)) {
      parts.push(t[0].slice(1, -1).replace(/\\([()\\])/g, '$1'));
    }
  }

  return parts
    .join('')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();
}

if (!existsSync(SRC_DIR)) {
  console.error(`No ${SRC_DIR} — nothing to extract.`);
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

const pdfs = readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
const results = [];

for (const pdf of pdfs) {
  const name = basename(pdf, '.pdf');
  const outPath = join(OUT_DIR, `${name}.txt`);
  const text = extractText(readFileSync(join(SRC_DIR, pdf)));
  const usable = text.length >= MIN_USEFUL_CHARS;

  if (usable && !CHECK) {
    writeFileSync(
      outPath,
      `# Extracted from ${pdf}\n` +
        `# NOT AUTHORITATIVE — the PDF is. Extraction is lossy; verify any quote\n` +
        `# against the PDF before relying on it. Regenerate: node scripts/extract-sources.mjs\n\n` +
        text +
        '\n',
    );
  }

  results.push({ pdf, chars: text.length, usable, exists: existsSync(outPath) });
}

let failed = 0;
console.log('');
for (const r of results) {
  if (r.usable) {
    console.log(`  ok           ${r.pdf}  (${r.chars.toLocaleString()} chars)`);
  } else {
    console.log(`  NO TEXT      ${r.pdf}  (${r.chars} chars — scanned, needs OCR)`);
  }
  if (CHECK && r.usable && !r.exists) {
    console.error(`  MISSING      ${r.pdf} extracted text absent — run without --check`);
    failed++;
  }
}

const scanned = results.filter((r) => !r.usable);
if (scanned.length > 0) {
  console.log(
    `\n  ${scanned.length} document(s) are image-only. Register them as ` +
      `text-not-extractable; they cannot be grepped without OCR.`,
  );
}

console.log(`\n  ${results.length - scanned.length}/${results.length} extracted to docs/sources/text/\n`);
process.exit(failed === 0 ? 0 : 1);

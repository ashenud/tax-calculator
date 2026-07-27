#!/usr/bin/env node
/**
 * Guardrail: no tax figure without a citation, and no broken relative link.
 *
 * WHAT THIS PROVES: that a citation is *present* next to every figure.
 * WHAT IT DOES NOT PROVE: that the citation is correct. A fabricated
 * `[IRA s.85(3)]` passes this script perfectly. Only `tax-rule-verifier`
 * reading the actual document catches that.
 *
 * This exists to stop the discipline decaying through carelessness as the docs
 * grow. It is a lint, not a fact-checker. See
 * docs/decisions/adr-0004-citation-discipline.md.
 *
 * Usage:  node scripts/check-citations.mjs [--quiet]
 * Exit:   0 clean, 1 violations found
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');

/** Directories whose figures must be cited. */
const CITED_DIRS = ['docs/research', 'docs/personas'];

/**
 * Files exempt from the citation rule.
 * The open-questions register is the designated home for uncited provisional
 * figures — that is the entire point of it existing.
 */
const CITATION_EXEMPT = new Set(['docs/research/12-open-questions.md']);

/** Roots scanned for broken relative links. */
const LINK_ROOTS = ['docs', 'README.md', 'CLAUDE.md', '.claude'];

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/** Rs. 1,800,000 / LKR 500000 */
const RE_MONEY = /\b(?:Rs\.?|LKR)\s*[\d][\d,]*/g;
/** 1,800,000 — a comma-grouped number is a tax figure in these docs */
const RE_GROUPED = /\b\d{1,3}(?:,\d{3})+\b/g;
/** 15% / 6.5% */
const RE_PERCENT = /\b\d+(?:\.\d+)?\s?%/g;

/** [IRA s.85(1)(a)] — any bracketed reference counts as a citation marker. */
const RE_CITATION = /\[[^\]]+\]/;

/**
 * Escape hatches, deliberately narrow and deliberately visible in the source.
 *   unverified  — a provisional figure, flagged as such to the reader
 *   illustrative — a figure demonstrating format or quoting example wording
 * Both are reported in the summary so their use stays conspicuous.
 */
const RE_MARKER = /\b(unverified|illustrative)\b/i;

/** [text](target) — ignores images and reference-style links. */
const RE_LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  if (statSync(dir).isFile()) {
    if (dir.endsWith('.md')) out.push(dir);
    return out;
  }
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.git')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Split a file into lines, flagging those inside fenced code blocks.
 * Fenced content is example syntax, not assertions about the law.
 */
function linesWithFenceState(text) {
  let fenced = false;
  return text.split('\n').map((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return { n: i + 1, text: line, fenced: true };
    }
    return { n: i + 1, text: line, fenced };
  });
}

/** A markdown table's delimiter row (|---|---|) carries no figures. */
const isTableDivider = (s) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(s) && s.includes('-');

function findFigures(line) {
  const hits = [];
  for (const re of [RE_MONEY, RE_GROUPED, RE_PERCENT]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

// ---------------------------------------------------------------------------
// Check 1 — figures carry citations
// ---------------------------------------------------------------------------

function checkCitations() {
  const violations = [];
  const marked = [];

  const files = CITED_DIRS.flatMap((d) => walk(join(ROOT, d)));

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (CITATION_EXEMPT.has(rel)) continue;

    for (const { n, text, fenced } of linesWithFenceState(readFileSync(file, 'utf8'))) {
      if (fenced || isTableDivider(text)) continue;

      const figures = findFigures(text);
      if (figures.length === 0) continue;

      if (RE_CITATION.test(text)) continue;

      if (RE_MARKER.test(text)) {
        marked.push({ rel, n, figures });
        continue;
      }

      violations.push({ rel, n, figures, text: text.trim() });
    }
  }

  return { violations, marked };
}

// ---------------------------------------------------------------------------
// Check 2 — relative links resolve
// ---------------------------------------------------------------------------

function checkLinks() {
  const broken = [];
  const files = LINK_ROOTS.flatMap((d) => walk(join(ROOT, d)));

  for (const file of files) {
    const rel = relative(ROOT, file);

    for (const { n, text, fenced } of linesWithFenceState(readFileSync(file, 'utf8'))) {
      if (fenced) continue;

      RE_LINK.lastIndex = 0;
      let m;
      while ((m = RE_LINK.exec(text)) !== null) {
        const target = m[1];
        if (/^(https?:|mailto:|#)/.test(target)) continue;

        const [path] = target.split('#');
        if (!path) continue;

        if (!existsSync(resolve(dirname(file), path))) {
          broken.push({ rel, n, target });
        }
      }
    }
  }

  return broken;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const { violations, marked } = checkCitations();
const broken = checkLinks();

if (violations.length > 0) {
  console.error('\nUNCITED FIGURES\n');
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.n}`);
    console.error(`    figures: ${v.figures.join(', ')}`);
    console.error(`    ${v.text.slice(0, 100)}`);
  }
  console.error(
    '\n  Every tax figure needs a citation on the same line, e.g. [IRA s.52, as amended by Act 2/2025 s.14].',
  );
  console.error(
    '  If the figure is not yet verified, it belongs in docs/research/12-open-questions.md — not in prose.\n',
  );
}

if (broken.length > 0) {
  console.error('\nBROKEN LINKS\n');
  for (const b of broken) console.error(`  ${b.rel}:${b.n} -> ${b.target}`);
  console.error('');
}

if (marked.length > 0 && !QUIET) {
  console.log(`\nFigures passing on an escape-hatch marker: ${marked.length}`);
  for (const m of marked) console.log(`  ${m.rel}:${m.n} — ${m.figures.join(', ')}`);
  console.log('  These are unverified or illustrative. They are not citations.');
}

const failed = violations.length + broken.length;

if (failed === 0) {
  console.log(
    `\nOK — ${violations.length === 0 ? 'no uncited figures' : ''}, no broken links.` +
      (marked.length ? ` (${marked.length} marker-exempt figures)` : ''),
  );
} else {
  console.error(`FAILED — ${violations.length} uncited figure(s), ${broken.length} broken link(s).`);
}

process.exit(failed === 0 ? 0 : 1);

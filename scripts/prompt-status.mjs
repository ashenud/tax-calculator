#!/usr/bin/env node
/**
 * Build-prompt status tracker.
 *
 * SINGLE SOURCE OF TRUTH: the `status:` field in each docs/prompts/P*.md front
 * matter. docs/prompts/INDEX.md is *generated* from those files. Two hand-maintained
 * copies of the same state drift, and a stale index that says "done" for something
 * half-built is worse than no index at all.
 *
 * Usage:
 *   node scripts/prompt-status.mjs list           show every prompt and its status
 *   node scripts/prompt-status.mjs next           print the next runnable prompt
 *   node scripts/prompt-status.mjs set P04 done   set a status
 *   node scripts/prompt-status.mjs sync           rewrite the table in INDEX.md
 *   node scripts/prompt-status.mjs --check        verify INDEX.md is in sync (CI)
 *
 * Statuses: pending | in-progress | done | blocked
 * "done" means it compiled AND its acceptance checks passed. Nothing else earns it.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'docs/prompts');
const INDEX = join(DIR, 'INDEX.md');

const STATUSES = ['pending', 'in-progress', 'done', 'blocked'];
const MARK_START = '<!-- STATUS-TABLE:START -->';
const MARK_END = '<!-- STATUS-TABLE:END -->';

const ICON = { pending: '☐', 'in-progress': '◐', done: '☑', blocked: '⛔' };

function parseFrontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([a-zA-Z_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, '');
    }
    out[kv[1]] = v;
  }
  return out;
}

function loadPrompts() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => /^P\d+.*\.md$/.test(f))
    .sort()
    .map((file) => {
      const path = join(DIR, file);
      const raw = readFileSync(path, 'utf8');
      const fm = parseFrontMatter(raw) || {};
      return {
        file,
        path,
        raw,
        id: fm.id || file.split('-')[0],
        title: fm.title || '(untitled)',
        status: fm.status || 'pending',
        depends: Array.isArray(fm.depends) ? fm.depends : fm.depends ? [fm.depends] : [],
      };
    });
}

function runnable(p, byId) {
  if (p.status !== 'pending') return false;
  return p.depends.every((d) => byId.get(d)?.status === 'done');
}

function renderTable(prompts) {
  const byId = new Map(prompts.map((p) => [p.id, p]));
  const rows = prompts.map((p) => {
    const blockedBy = p.depends.filter((d) => byId.get(d)?.status !== 'done');
    const note =
      p.status === 'pending' && blockedBy.length ? `waiting on ${blockedBy.join(', ')}` : '';
    return `| ${ICON[p.status] ?? '?'} | \`${p.id}\` | [${p.title}](${p.file}) | ${p.status} | ${p.depends.join(', ') || '—'} | ${note} |`;
  });

  const done = prompts.filter((p) => p.status === 'done').length;
  return [
    `**${done} of ${prompts.length} complete.**`,
    '',
    '| | ID | Prompt | Status | Depends on | |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

function sync(prompts, { check = false } = {}) {
  if (!existsSync(INDEX)) {
    console.error(`Missing ${INDEX}`);
    return 1;
  }
  const raw = readFileSync(INDEX, 'utf8');
  const s = raw.indexOf(MARK_START);
  const e = raw.indexOf(MARK_END);
  if (s < 0 || e < 0) {
    console.error(`INDEX.md is missing ${MARK_START} / ${MARK_END} markers.`);
    return 1;
  }
  const next = raw.slice(0, s + MARK_START.length) + '\n' + renderTable(prompts) + '\n' + raw.slice(e);

  if (check) {
    if (next !== raw) {
      console.error('INDEX.md is out of sync with the prompt files.');
      console.error('  Run: node scripts/prompt-status.mjs sync');
      return 1;
    }
    console.log('INDEX.md is in sync.');
    return 0;
  }

  writeFileSync(INDEX, next);
  console.log('INDEX.md updated.');
  return 0;
}

// ---------------------------------------------------------------------------

const [cmd, ...args] = process.argv.slice(2);
const prompts = loadPrompts();
const byId = new Map(prompts.map((p) => [p.id, p]));

if (prompts.length === 0) {
  console.log('No prompts found in docs/prompts/.');
  process.exit(0);
}

switch (cmd) {
  case 'list':
  case undefined: {
    console.log();
    for (const p of prompts) {
      const mark = runnable(p, byId) ? '  <- next' : '';
      console.log(`  ${ICON[p.status] ?? '?'} ${p.id.padEnd(4)} ${p.status.padEnd(12)} ${p.title}${mark}`);
    }
    const done = prompts.filter((p) => p.status === 'done').length;
    console.log(`\n  ${done}/${prompts.length} done\n`);
    break;
  }

  case 'next': {
    const p = prompts.find((x) => runnable(x, byId));
    if (!p) {
      const blocked = prompts.filter((x) => x.status === 'pending');
      if (blocked.length === 0) console.log('All prompts are done or in progress.');
      else {
        console.log('Nothing runnable — every pending prompt is waiting on an unfinished dependency:');
        for (const b of blocked) {
          console.log(`  ${b.id}  waits on ${b.depends.filter((d) => byId.get(d)?.status !== 'done').join(', ')}`);
        }
      }
      break;
    }
    console.log(`${p.id}  ${p.title}`);
    console.log(`docs/prompts/${p.file}`);
    break;
  }

  case 'set': {
    const [id, status] = args;
    if (!id || !STATUSES.includes(status)) {
      console.error(`Usage: set <id> <${STATUSES.join('|')}>`);
      process.exit(1);
    }
    const p = byId.get(id);
    if (!p) {
      console.error(`No prompt with id ${id}`);
      process.exit(1);
    }
    if (status === 'done') {
      const unmet = p.depends.filter((d) => byId.get(d)?.status !== 'done');
      if (unmet.length) {
        console.error(`Refusing: ${id} depends on ${unmet.join(', ')}, which is not done.`);
        process.exit(1);
      }
    }
    writeFileSync(p.path, p.raw.replace(/^status:.*$/m, `status: ${status}`));
    p.status = status;
    console.log(`${id} -> ${status}`);
    sync(prompts);
    break;
  }

  case 'sync':
    process.exit(sync(prompts));

  case '--check':
    process.exit(sync(prompts, { check: true }));

  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}

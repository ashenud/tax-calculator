---
description: Execute one numbered build prompt, verify it, and set its status
argument-hint: <prompt id, e.g. P04 — or omit to run the next one>
---

Execute build prompt: **$ARGUMENTS**

If no id was given, resolve it:

```bash
node scripts/prompt-status.mjs next
```

Then:

1. Read `docs/prompts/<id>-*.md` in full, and every document under its "Read first".
2. Confirm its `depends` are all `done`. If not, stop and report — building on an
   unfinished dependency creates work that must be redone.
3. Dispatch the subagent named in the prompt's `agent:` front matter. Pass it the prompt
   path, the dependency state, and any relevant open questions from
   `docs/research/12-open-questions.md`.
4. When it reports back, **run the acceptance checks yourself** rather than taking its
   word:

```bash
npm run typecheck && npm run test && npm run build
node scripts/check-citations.mjs
node scripts/prompt-status.mjs --check
```

5. Set the status honestly:

```bash
node scripts/prompt-status.mjs set <id> done        # only if everything passed
node scripts/prompt-status.mjs set <id> blocked     # if it cannot proceed
```

Leave it `in-progress` if the work is partial.

**`done` means the checks actually passed**, not that the agent said they did. Marking a
prompt `done` with failing tests poisons every prompt after it, because the next one
begins by trusting yours.

If the agent reports that the prompt contradicted a spec, confirm the spec won, and update
the prompt file so the next reader is not misled.

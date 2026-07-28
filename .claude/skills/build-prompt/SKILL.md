---
name: build-prompt
description: The procedure for executing one numbered build prompt from docs/prompts — reading it, checking dependencies, doing the work, running its acceptance checks, and setting its status honestly. Load before running any P-numbered prompt.
---

# Executing a build prompt

One prompt per run. The prompts are ordered because later ones assume earlier ones landed.

## 1. Before starting

```bash
node scripts/prompt-status.mjs next     # confirm this is the one to run
```

Read the prompt in full, then read every document under its "Read first". Those are not
background reading — they are the spec you are implementing, and the prompt is only a
summary of them.

Check the prompt's `depends` are all `done`. If not, stop and say so; building on an
unfinished dependency produces work that has to be redone.

Set the status:

```bash
node scripts/prompt-status.mjs set P04 in-progress
```

## 2. While working

**The specs win over the prompt.** The prompts were written before the code existed and
contain mistakes. If a prompt contradicts `docs/spec/`, follow the spec — it is traceable
to the Act — fix the prompt, and say so in your report.

**Never invent tax data.** If a value is missing from `data/tax-years/`, stop. Do not fill
it from memory or from a web search. That is the exact failure this repository is built
against, and it has already happened once here — see ADR-0004.

**Stay inside the prompt's scope.** Each prompt names what it owns and what it does not.
Reaching ahead into the next prompt's work produces a tangle and makes both harder to
verify.

## 3. Verification — this is what `done` means

Run every acceptance check the prompt lists, plus:

```bash
npm run typecheck
npm run test
npm run build
node scripts/check-citations.mjs
```

**A check you did not run is a check that failed.** If something cannot be verified in
this environment — a screen-reader pass, a deployed-site network check — say so plainly
rather than reporting it as passed.

## 4. Setting the status

| Outcome | Status |
|---|---|
| Everything built, every acceptance check passed | `done` |
| Partly built, or a check failed | leave `in-progress` and report what remains |
| Cannot proceed — missing data, unresolved spec, broken dependency | `blocked`, and say why |

```bash
node scripts/prompt-status.mjs set P04 done
```

The script refuses `done` if a dependency is unfinished. It cannot tell whether your
checks actually passed — that part is on you, and marking `done` on a prompt whose tests
fail poisons every prompt after it, because the next one starts by trusting yours.

`blocked` is a useful, respectable outcome. It is much better than a `done` that quietly
carries a defect forward.

## 5. Reporting

- What you built
- Each acceptance check and its actual result
- Anything you could not verify, said plainly
- Any prompt or spec error you found, and what you did about it
- What the next prompt should know

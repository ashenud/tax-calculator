---
name: verify-tax-claim
description: The standard procedure for confirming or refuting one Sri Lankan tax figure against primary legislation, and for recording the result in the open-questions register. Use when promoting a figure from unverified to settled, resolving a conflict between sources, or checking a rate, threshold or deadline before it is relied on.
---

# Verifying a tax claim

One claim, one run. The output is a verdict backed by verbatim quoted text, plus the
exact edit to make to the open-questions register.

## Step 1 — Restate the claim so it can be falsified

A verifiable claim names the figure, the thing it applies to, and the year of
assessment.

- ✅ "For Y/A 2025/2026, personal relief for a resident individual is Rs. 1,800,000."
- ❌ "Personal relief is Rs. 1.8 million." — no Y/A, no taxpayer class. Return `malformed`.

If the claim bundles two things ("the rate is 15% and it applies to freelancers"),
split it. The rate may be right and the scope wrong; a single verdict would hide that.

## Step 2 — Find the governing provision

1. Check `docs/sources/README.md` for what is held and each document's status.
2. Search the **base act** for the provision.
3. Then search **every amendment act held** for a provision that amends, replaces or
   repeals it. Do this even after finding a clean answer in the base act — this step is
   where most wrong-but-widely-repeated figures are caught.
4. Check any IRD public notice for the department's administrative position.

If nothing in the documents held addresses the claim: `not-found`. Name the document
that would settle it so it can be added to `docs/sources/`.

## Step 3 — Read around the hit

A grep match drops you into the middle of a provision. Before concluding:

- Read the **whole subsection**, plus the provisos that follow it. Sri Lankan drafting
  puts crucial conditions in provisos after the operative words.
- Resolve **defined terms**. "Remitted", "bank", "utilized outside Sri Lanka" carry
  weight, and a definition may be narrower than ordinary usage — or may not exist at all,
  which is itself a finding. Do not import a qualifier the text does not have: the
  foreign-income condition says "remitted through a bank", and the near-universal
  secondary-source rendering as "licensed bank" is a gloss, not the statute.
- Check the **schedule** if the section points at one. Rate tables usually live in
  schedules, and the schedules are amended independently of the sections.

## Step 4 — Check the effective date

A provision being in an act does not mean it applied in the Y/A claimed. Find the
commencement provision. Amendments commonly apply from 1 April of a year — but not
always, and often not uniformly across the act's provisions.

If the provision is right but applied from a different date than the claim assumes, the
verdict is `contradicted`, not `verified`.

## Step 5 — Verdict

| Verdict | When |
|---|---|
| `verified` | The provision says this, for this Y/A, and no amendment changes it |
| `contradicted` | The provision says something different — give the correct figure |
| `partially-verified` | Correct but subject to a condition or exception the claim omits |
| `not-found` | Nothing in the documents held addresses it |
| `malformed` | Not falsifiable as stated |

Each verdict except `not-found` and `malformed` requires a **verbatim quote** of the
operative words. If you cannot produce one, you have not verified anything — return
`not-found` instead.

## Step 6 — Record it

Update the row in `docs/research/12-open-questions.md`:

- `verified` → move the figure into the relevant research document with its citation,
  and change the register row's status. Update that document's status block: it may
  become `verified` only when every figure in it has been verified.
- `contradicted` → correct the figure everywhere it appears, and leave a row in the
  register recording what the wrong value was and where it came from. Keeping the
  correction history matters, because a wrong figure that was published once tends to
  come back.
- `partially-verified` → record the figure *and* the omitted condition as a separate
  open item.
- `not-found` → add the required document to the "Should have" list in
  `docs/sources/README.md`.

## The failure mode this procedure exists to prevent

You will recognise many of these figures. Sri Lankan rate bands are widely published and
the 2025 changes were heavily covered. Recognition feels exactly like knowledge, and it
is the single most likely way a wrong number gets marked `verified` in this repo.

If you have not read it in a document in `docs/sources/` during this run, you have not
verified it. `not-found` on a claim you are personally confident about is the correct
and useful answer.

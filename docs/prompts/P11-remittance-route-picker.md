---
id: P11
title: The remittance route picker — the question that distinguishes this tool
status: pending
depends: [P10]
agent: ui-builder
---

# P11 — Remittance route picker

## Read first

- [`../spec/ui-behaviour.md`](../spec/ui-behaviour.md) — "The remittance question"
- [`../research/05-foreign-currency-service-income.md`](../research/05-foreign-currency-service-income.md) — the statutory wording and its unanswered edges
- [`../personas/p1-wfh-foreign-consultant.md`](../personas/p1-wfh-foreign-consultant.md)

## Why this prompt exists separately

The condition is "received in foreign currency **and** remitted through a bank to Sri
Lanka" [IRA Sch.1 para 1(6), ins. Act 2/2025 s.3(1)(d)]. Rendered naively that is a yes/no
question — and a consultant cannot reliably answer it. A wrong answer here swings the
liability more than any other input in the tool.

Every other calculator either does not ask, or asks a yes/no. Getting this right is the
project's reason for existing.

## Task

Render the condition as a **route picker with an amount per route**:

| Route | Behaviour |
|---|---|
| Direct transfer into my Sri Lankan bank account | condition met; cap applies |
| Into a foreign-currency account at a Sri Lankan bank | **unresolved (Q13)** — flag, do not decide |
| Through Wise / Payoneer / PayPal, then withdrawn to a Sri Lankan bank | **unresolved (Q41)** — flag, do not decide |
| Kept in an account outside Sri Lanka | condition not met; ladder applies, with an explicit warning saying why |
| A mixture — amount against each | **unresolved (Q11)** — refuse the computation |

Where unresolved, say so in the user's terms: *"The law does not clearly say how this case
is treated. We are not going to guess at your tax."* Then name what would settle it and
point at a practitioner.

## Do not

- Reduce this to a yes/no
- Resolve Q11, Q13 or Q41 with a sensible-looking default
- Phrase any option in statutory language — the user is describing what happened to their
  money, not classifying it
- Suggest that one route would be better than another. That is advice, and it is
  prohibited by rule 6 of [`../../CLAUDE.md`](../../CLAUDE.md).

## Acceptance

- Selecting "kept offshore" produces the ladder result **and** a warning naming the
  condition as the reason — the user must learn the condition exists
- Selecting "mixture" produces a refusal with no figure
- Selecting an unresolved route flags it and does not silently pick a treatment
- The contrast is demonstrable: identical gross income, direct-to-bank vs offshore,
  produces materially different tax, and both paths explain themselves
- Copy contains no recommendation to route money any particular way — checked by reading
  it, and worth a second pair of eyes

## Report

The exact copy used for each route and for the unresolved cases. This is user-facing text
on the most consequential question in the tool; quote it in full so it can be reviewed.

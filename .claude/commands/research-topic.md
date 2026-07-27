---
description: Research a Sri Lankan tax topic from primary sources and write it up with citations
argument-hint: <topic, e.g. "terminal benefits" or "docs/research/06-apit.md">
---

Research this topic for the tax documentation: **$ARGUMENTS**

Use the `tax-researcher` subagent. Before dispatching it:

1. Check whether `docs/sources/` actually contains PDFs. If it is empty, say so up front
   in your report — the output will be a research brief, not findings, and that must not
   be presented as though the law had been read.
2. Check `docs/research/12-open-questions.md` for anything already recorded on this
   topic, and pass it to the agent so it does not re-open settled questions or
   contradict a recorded conflict.
3. Identify which research document this belongs in — extend an existing numbered file
   rather than creating a new one unless the topic genuinely has no home.

Pass the agent: the topic, the target file, the relevant open questions, and which
source documents are available.

When it reports back, do not mark the document `verified`. That requires
`tax-rule-verifier` runs against each figure — run `/verify-rates` for the significant
ones before promoting the status block.

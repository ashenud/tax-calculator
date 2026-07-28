---
description: Show build progress and what to run next
---

Report where the build has got to.

```bash
node scripts/prompt-status.mjs list
node scripts/prompt-status.mjs next
node scripts/prompt-status.mjs --check
```

Then summarise for the user:

- How many prompts are done, in progress, blocked
- What is runnable now, and what it depends on
- Any prompt marked `blocked` and the reason recorded in its file
- Whether `INDEX.md` had drifted from the prompt files

If anything is `blocked`, say what would unblock it. Several prompts depend on tax data
that in turn depends on primary sources the repository does not hold — if that is the
cause, name the missing document rather than the prompt.

Do not change any status from this command. It reports only.

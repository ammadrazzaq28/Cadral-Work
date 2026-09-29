---
name: ask-audit
description: Before handing work over - checks that every ask the user made in the conversation made it into the result. Use right before saying work is done, opening a PR, or sending a deliverable.
---

# Ask Audit

Nothing gets handed over until every ask is accounted for.

## Steps

1. **Collect every ask.** Re-read the whole conversation (and any linked issue, Slack thread or ClickUp task). List each request, constraint, preference and correction as its own line. Later corrections override earlier asks; note that.
2. **Map each ask to evidence.** For each line, point to where it is satisfied: file and line, commit, command output, screenshot, or message. "I think I did it" is not evidence.
3. **Mark status:**
   - ✅ done, with evidence
   - ⚠️ partly done, say what is missing
   - ❌ not done, say why (blocked, out of scope, needs a decision)
4. **Fix before handing over.** Anything ⚠️ or ❌ that can be done now, do it, then re-check (use `verification-before-completion`).
5. **Hand over** with a short table: ask → status → evidence. List anything still open and what is needed from the user.

## Rules
- Include implicit asks (language, format, branch, "no explanation", naming, where to save - e.g. Dera, Slack, ClickUp).
- Don't add asks the user never made.
- If an ask was dropped on purpose, say so plainly.

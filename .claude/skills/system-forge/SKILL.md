---
name: system-forge
description: Turning a project into an engine - adds agents, rules, checks, tests and memory so the project runs reliably with Claude. Use when a project works but needs to become repeatable and self-checking.
---

# System Forge

Turn a working project into an engine: clear roles, enforced rules, automatic checks, real tests, and memory that survives sessions.

## 1. Map the project
Read the code, README, CLAUDE.md and recent history. Write down: what the system does, the main workflows, what breaks often, and what is done by hand today.

## 2. Build the five parts

**Agents** - `.claude/agents/<name>.md`
- One agent per recurring role (e.g. implementer, reviewer, tester, release). Each has a narrow job, the tools it needs, and a clear "done" definition.
- Keep builder and reviewer separate.

**Rules** - `CLAUDE.md` (+ nested `CLAUDE.md` per folder when needed)
- Commands to install / run / test / lint.
- Conventions, do / don't lists, which skills to use when (brainstorming → writing-plans → executing-plans, TDD, systematic-debugging, verification-before-completion, ask-audit).

**Checks** - `.claude/settings.json` hooks + CI
- Hooks for format / lint / typecheck after edits, and tests before stop where cheap.
- A CI workflow that runs the same checks on every push.
- Permissions: allow safe commands, block dangerous ones.

**Tests**
- Find untested critical paths; add tests for them (TDD for anything new).
- One command runs everything; it must pass before any hand-over.

**Memory**
- `docs/decisions.md` for decisions and why.
- `docs/specs/` and `docs/plans/` for feature history.
- Save reusable skills to `.claude/skills/` and to the Dera dashboard; save outputs and open tasks to Dera / ClickUp.

## 3. Prove it
- Run all checks and tests; show the output.
- Do one small real task through the new setup end to end.
- Run `ask-audit`, commit, and report what was added and what is still manual.

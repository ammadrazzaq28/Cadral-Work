---
name: newproject
description: Starting a project - sets up the standard Cadral folder structure, CLAUDE.md, and skills so every project starts the same way. Use when creating a new project or repo.
---

# New Project (Cadral structure)

## 1. Ask (only if not already clear)
- Project name and one-line purpose.
- Stack (e.g. Node, Python, Swift, web).
- Where it lives (new repo, folder in this repo).

## 2. Create the structure

```
<project>/
├── CLAUDE.md            # purpose, stack, commands, rules for Claude
├── README.md            # what it is, setup, how to run
├── .env.example         # every env var, no real secrets
├── .gitignore
├── .claude/
│   ├── skills/          # project skills (copy the team set)
│   ├── agents/          # project subagents
│   └── settings.json    # permissions / hooks
├── docs/
│   ├── specs/           # brainstorming output, one file per feature
│   ├── plans/           # writing-plans output
│   └── decisions.md     # short log of key decisions
├── src/                 # source code
├── tests/               # tests mirror src/
└── scripts/             # setup, dev, deploy helpers
```

## 3. Fill the basics
- `CLAUDE.md`: purpose, stack, how to install / run / test / lint, rules (use the team skills, save new skills to Dera, ask-audit before handover).
- `README.md`: setup and run steps.
- Copy team skills into `.claude/skills/` (superpowers + tools, ask-audit, newproject, system-forge).
- Add the stack's test runner and one passing smoke test.

## 4. Finish
- `git init` (if new), first commit "Scaffold <project> with Cadral structure".
- Create a ClickUp list / task for the project if the user wants tracking.
- Run `ask-audit`, then report the tree and next step.

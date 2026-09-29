# Project notes for Claude

## Skills
- Whenever a skill is added or updated in `.claude/skills/`, also save it to the Dera dashboard with `mcp__Dera__save_skill` (name and description from the frontmatter, content = full SKILL.md).
- When the user names a new command/skill, first check `.claude/skills/`; if missing, search GitHub for a matching skill, add it to `.claude/skills/`, and save it to Dera.

## Commands
| Command | Use |
|---|---|
| `/tools` | Any task. Searches the whole stack (the Stack Console), picks the best current tool for each step and runs it. Start here when unsure. |
| `/brainstorming` (superpowers) | Before building anything: pins down what is actually wanted. |
| `/writing-plans` → `/executing-plans` (superpowers) | Any build with several steps: plan first, then run it with checkpoints. |
| `/test-driven-development` (superpowers) | Writing code: the test first, then the code. |
| `/systematic-debugging` (superpowers) | Anything broken: find the cause before fixing it. |
| `/verification-before-completion` (superpowers) | Before saying anything is done: run the check and show the result. |
| `/ask-audit` | Before handing work over: checks that every ask made it in. |
| `/newproject` | Starting a project: the Cadral folder structure. |
| `/system-forge` | Turning a project into an engine: agents, rules, checks, tests and memory. |
| `/graph-engineering` + `/loop-design-check` | Choosing an agent architecture, and checking that a loop cannot spin or cheat its own checks. |
| `/skill-creator` | Making or changing a skill: every skill passes an eval before it counts as shipped. |
| `/mem-search` (claude-mem) | Finding what was done in an earlier session. |
| `/hypit` → `/hyperframes*` + `/remotion-*` | Video: Hypit directs, Hyperframes and Remotion build it. |
| `/copywriting` + `/avoid-ai-writing` | Any words a client or the public will read. |
| `/firecrawl*` | Web research and reading pages. |
| `/code-review` (built-in) | Reviewing changes before they are merged. |

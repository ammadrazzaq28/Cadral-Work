# Project notes for Claude

## Skills
- Whenever a skill is added or updated in `.claude/skills/`, also save it to the Dera dashboard with `mcp__Dera__save_skill` (name and description from the frontmatter, content = full SKILL.md).
- When the user names a new command/skill, first check `.claude/skills/`; if missing, search GitHub for a matching skill, add it to `.claude/skills/`, and save it to Dera.

## Commands
| Command | Use |
|---|---|
| `/tools` | Any task. Searches the whole stack (the Stack Console), picks the best current tool for each step and runs it. Start here when unsure. |
| `/brainstorming` (superpowers) | Before building anything: pins down what is actually wanted. |

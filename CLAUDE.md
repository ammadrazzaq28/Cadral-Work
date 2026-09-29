# Project notes for Claude

## Skills
- Whenever a skill is added or updated in `.claude/skills/`, also save it to the Dera dashboard with `mcp__Dera__save_skill` (name and description from the frontmatter, content = full SKILL.md).
- When the user names a new command/skill, first check `.claude/skills/`; if missing, search GitHub for a matching skill, add it to `.claude/skills/`, and save it to Dera.

## Skill folders
Skills live flat in `.claude/skills/` (Claude Code needs that). The folders in `.claude/skill-folders/<folder>/` group them; the same folder names are the `category` in the Dera dashboard.

| Folder | For |
|---|---|
| `code` | Dev workflow for any build: plan, TDD, debug, review, verify, project setup |
| `app-development` | App A-Z: UI/UX, splash, icons, prompts, mobile, backend, store launch |
| `video` | Hypit, Hyperframes, Remotion |
| `research` | Firecrawl web research |
| `writing` | Copy and public-facing text |
| `wordpress` | WordPress sites: block themes, blocks, plugins, local env, MCP, performance |

Rules:
- First decide which folder the task belongs to. Suggest and use skills **only from that folder** (plus `code` for any build work). Never suggest skills from an unrelated folder (e.g. no WordPress or video skills while building an app).
- If the folder has no fitting skill, say so and search GitHub for one; don't borrow from an unrelated folder.
- Every new skill gets a folder: symlink it into `.claude/skill-folders/<folder>/` and save it to Dera with `category` = folder name.

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

## app-development folder sources
- `wshobson/agents`: 83 skills
- `evanca/flutter-ai-rules`: 37 skills
- `mattpocock/skills`: 35 skills
- `expo/skills`: 26 skills
- `addyosmani/agent-skills`: 24 skills
- `plugin87/ux-ui-agent-skills`: 17 skills
- `Leonxlnx/taste-skill`: 13 skills
- `callstackincubator/agent-skills`: 13 skills
- `treylom/prompt-engineering-skills`: 10 skills
- `vercel-labs/agent-skills`: 9 skills
- `nextlevelbuilder/ui-ux-pro-max-skill`: 7 skills
- `Jakubantalik/transitions.dev`: 4 skills
- `Code-with-Beto/skills`: 4 skills
- `Appllama/appllama-skills`: 2 skills
- `AvdLee/SwiftUI-Agent-Skill`: 2 skills
- `skydashnet/material-design-3-ui-skill`: 1 skills
- `designrique/ai-graphic-design-skill`: 1 skills
- `nolangz/pixel2motion`: 1 skills
- `splash-screen`: written for Cadral (no good repo skill existed)

## wordpress folder sources
- `WordPress/agent-skills` (official): 19 skills
- `Automattic/wordpress-agent-skills`: site-specification, wordpress-block-theming, design-systems

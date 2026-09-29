---
name: tools
description: Any task. It searches the whole stack (the Stack Console), picks the best current tool for each step and runs it. Start here when unsure.
---

# /tools — Stack Console router

Use this for any task when you are unsure which tool, skill or connector fits.

## Steps

1. **Split the task** into concrete steps (research, write, code, design, publish, notify...).
2. **Search the whole stack** for each step:
   - Project and plugin skills listed in this session (`.claude/skills/*`, e.g. brainstorming, writing-plans, test-driven-development, systematic-debugging).
   - Dera team dashboard: `suggest_skills` with a short task description, and `list_tools` for tools the team already reviewed.
   - Connected MCP servers: run `ToolSearch` with keywords for the step (e.g. "slack send", "clickup task", "drive file", "github pull request").
   - Built-in tools: Bash, Read/Edit/Write, Agent, Artifact, WebSearch/WebFetch.
3. **Pick the best current tool** per step. Prefer, in order:
   a saved team skill (Dera) → a project skill → a dedicated MCP tool → a built-in tool.
   Pick the one that finishes the step in the fewest calls with the least risk.
4. **Show the plan** in one short list: `step → tool`. If a step is outward-facing (sending messages, posting, deleting, publishing), confirm before running it.
5. **Run it** step by step. If a tool fails or is missing, fall back to the next best option and note it.
6. **Finish** with a one-line result per step. If the user says "save this", store it in Dera (`save_output`, `save_skill`, `save_tool` or `save_task`).

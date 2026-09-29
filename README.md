# cadral-clickup-slack

A small Node.js service that syncs tasks to **ClickUp** and notifies the Slack
channel **#all-cadral** when a task is marked complete.

> **Context:** Built from this Slack thread —
> https://cadral.slack.com/archives/D0C558NAG4V/p1790698741796129?thread_ts=1790698684.042799&cid=D0C558NAG4V

It does two things:

1. **Create/sync tasks in ClickUp** — a module (`src/clickup.js`) and a CLI
   (`src/createTask.js`) that create tasks in a ClickUp list.
2. **Notify on completion** — a webhook server (`src/server.js`) that receives
   ClickUp events and posts to Slack when a task moves into a completed status.

All secrets and IDs come from environment variables. Nothing is hardcoded.

---

## Prerequisites

- **Node.js >= 18** (uses built-in `fetch`; ES modules).
- A **ClickUp** account with API access and a target **list id**.
- A **Slack** workspace where you can add a bot or an incoming webhook for
  `#all-cadral`.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and fill in the values
```

### Environment variables

See `.env.example` for the full list with comments. Summary:

| Variable                    | Required | Purpose                                                        |
| --------------------------- | -------- | -------------------------------------------------------------- |
| `CLICKUP_API_TOKEN`         | yes      | ClickUp personal API token (raw `Authorization` header value). |
| `CLICKUP_LIST_ID`           | yes      | List where `create-task` adds tasks.                           |
| `CLICKUP_WEBHOOK_SECRET`    | optional | Verifies webhook `X-Signature` (HMAC-SHA256 of raw body).      |
| `CLICKUP_COMPLETE_STATUSES` | optional | Comma-separated status names that mean "done".                 |
| `SLACK_BOT_TOKEN`           | one of   | Bot token (`xoxb-…`) for `chat.postMessage` (preferred).       |
| `SLACK_WEBHOOK_URL`         | one of   | Incoming webhook URL (used if no bot token).                   |
| `SLACK_CHANNEL`             | optional | Channel for bot posts. Default `#all-cadral`.                  |
| `PORT`                      | optional | Server port. Default `3000`.                                   |

---

## Getting a ClickUp API token and list id

1. **API token:** In ClickUp, go to your avatar → **Settings** → **Apps** →
   **API Token**. Copy the personal token into `CLICKUP_API_TOKEN`.
2. **List id:** Open the target list in the browser. The URL contains the id,
   e.g. `https://app.clickup.com/…/li/<LIST_ID>`. Put it in `CLICKUP_LIST_ID`.
   You can also list spaces/folders/lists via the ClickUp API.

## Setting up Slack for #all-cadral

**Option A — Bot token (recommended):**

1. Create a Slack app at https://api.slack.com/apps → **From scratch**.
2. Under **OAuth & Permissions**, add the **`chat:write`** bot scope
   (add `chat:write.public` if you want to post without inviting the bot).
3. **Install** the app to the workspace and copy the **Bot User OAuth Token**
   (`xoxb-…`) into `SLACK_BOT_TOKEN`.
4. Invite the bot to the channel: `/invite @your-bot` in **#all-cadral**.
5. Set `SLACK_CHANNEL=#all-cadral` (the default).

**Option B — Incoming webhook:**

1. In your Slack app, enable **Incoming Webhooks** and **Add New Webhook to
   Workspace**, choosing **#all-cadral**.
2. Copy the webhook URL into `SLACK_WEBHOOK_URL`.

The service prefers the bot token when both are set.

---

## Running the server

```bash
npm start
```

- Health check: `GET /health` → `{ "ok": true }`
- Webhook endpoint: `POST /clickup/webhook`

For local testing, expose the port with a tunnel (e.g. `ngrok http 3000`) so
ClickUp can reach the webhook.

## Registering the ClickUp webhook

Register a webhook for your team so completion events reach this server. Replace
`<team_id>`, `<TOKEN>`, and the endpoint URL:

```bash
curl -X POST "https://api.clickup.com/api/v2/team/<team_id>/webhook" \
  -H "Authorization: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://your-public-host/clickup/webhook",
    "events": ["taskStatusUpdated"]
  }'
```

The response includes a `secret` — put it in `CLICKUP_WEBHOOK_SECRET` so
incoming requests are verified via the `X-Signature` header.

> You can also listen to `taskUpdated`; the handler detects completion from the
> status change either way.

### What counts as "completed"?

A task is treated as completed when its new status has ClickUp `type`
`"closed"` or `"done"`, **or** its status name (case-insensitive) is one of
`complete`, `completed`, `closed`, `done`. Override the name list with
`CLICKUP_COMPLETE_STATUSES` (comma-separated).

On completion the service posts a message like:

> :white_check_mark: Task **Ship the thing** completed

including a link to the ClickUp task and who completed it when available.

---

## Creating tasks (CLI)

```bash
# via npm script (note the -- before args)
npm run create-task -- "Write the launch email" --priority 2 --due 2026-02-01

# or directly
node src/createTask.js "Fix the login bug" \
  --description "Users can't reset passwords" \
  --assignee 12345 \
  --status "in progress"

# help
node src/createTask.js --help
```

Options:

| Flag                  | Meaning                                    |
| --------------------- | ------------------------------------------ |
| `--description`, `-d` | Task description.                          |
| `--assignee`, `-a`    | ClickUp user id (repeat for multiple).     |
| `--due`               | ISO date (`2026-02-01`) or epoch ms.       |
| `--priority`, `-p`    | `1`=urgent, `2`=high, `3`=normal, `4`=low. |
| `--status`, `-s`      | Status name within the list.               |

On success it prints the created task id and URL.

---

## Project layout

```
src/
  config.js       env parsing + validation
  clickup.js      ClickUp API client (createTask, getTask)
  slack.js        Slack notifier (bot token or incoming webhook)
  webhook.js      Express router: /clickup/webhook + signature verify
  server.js       Express app + /health, mounts the webhook router
  createTask.js   CLI to create a task
.env.example      documented env vars
```

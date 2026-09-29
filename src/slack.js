// Slack notifier. Uses chat.postMessage with a bot token when available,
// otherwise falls back to an incoming webhook URL.
import { config } from "./config.js";
import { getFirstInstallation } from "./tokenStore.js";

const CHAT_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

/**
 * Post a message to the configured Slack channel (#all-cadral by default).
 * Bot token precedence: (a) SLACK_BOT_TOKEN env, else (b) a stored OAuth
 * installation's bot token, else (c) fall back to the incoming webhook URL.
 * @param {string} text        - Fallback / notification text (required).
 * @param {object[]} [blocks]  - Optional Slack Block Kit blocks for rich layout.
 */
export async function notify(text, blocks) {
  if (!text) throw new Error("slack.notify requires message text.");

  if (config.slack.botToken) {
    return postWithBotToken(config.slack.botToken, text, blocks);
  }

  const installation = getFirstInstallation();
  if (installation?.botToken) {
    return postWithBotToken(installation.botToken, text, blocks);
  }

  if (config.slack.webhookUrl) {
    return postWithWebhook(text, blocks);
  }
  throw new Error(
    "No Slack destination configured: set SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL."
  );
}

// Post via chat.postMessage using a Bearer bot token.
async function postWithBotToken(botToken, text, blocks) {
  const payload = { channel: config.slack.channel, text };
  if (blocks) payload.blocks = blocks;

  const res = await fetch(CHAT_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  // Slack returns HTTP 200 with { ok: false, error } on failure.
  if (!res.ok || !body.ok) {
    const detail = body.error || `HTTP ${res.status}`;
    throw new Error(`Slack chat.postMessage failed: ${detail}`);
  }
  return body;
}

// Post via an incoming webhook URL. Channel is fixed by the webhook config.
async function postWithWebhook(text, blocks) {
  const payload = { text };
  if (blocks) payload.blocks = blocks;

  const res = await fetch(config.slack.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  // Incoming webhooks respond with the literal string "ok" on success.
  if (!res.ok || responseText.trim() !== "ok") {
    throw new Error(
      `Slack incoming webhook failed: HTTP ${res.status} ${responseText}`
    );
  }
  return { ok: true };
}

/**
 * Build a completion notification (text + Block Kit blocks) for a task.
 * @param {object} opts
 * @param {string} opts.name        - Task name.
 * @param {string} [opts.url]       - ClickUp task URL.
 * @param {string} [opts.completedBy] - Display name of who completed it.
 * @param {string} [opts.status]    - Final status name.
 * @returns {{ text: string, blocks: object[] }}
 */
export function buildCompletionMessage({ name, url, completedBy, status } = {}) {
  const safeName = name || "(untitled task)";
  const text = `:white_check_mark: Task *${safeName}* completed`;

  const lines = [text];
  if (completedBy) lines.push(`Completed by: ${completedBy}`);
  if (status) lines.push(`Status: ${status}`);
  if (url) lines.push(`<${url}|View in ClickUp>`);

  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text: lines.join("\n") },
    },
  ];

  return { text, blocks };
}

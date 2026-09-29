// Central configuration: reads and validates environment variables.
// All secrets/IDs come from the environment — nothing is hardcoded.
import dotenv from "dotenv";

dotenv.config();

// Default statuses (by name, case-insensitive) that count as "completed".
const DEFAULT_COMPLETE_STATUSES = ["complete", "completed", "closed", "done"];

/**
 * Parse the optional comma-separated CLICKUP_COMPLETE_STATUSES env var into a
 * lowercased list. Falls back to the sensible defaults above.
 */
function parseCompleteStatuses(raw) {
  if (!raw || !raw.trim()) return DEFAULT_COMPLETE_STATUSES;
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_COMPLETE_STATUSES;
}

export const config = {
  clickup: {
    apiToken: process.env.CLICKUP_API_TOKEN || "",
    listId: process.env.CLICKUP_LIST_ID || "",
    webhookSecret: process.env.CLICKUP_WEBHOOK_SECRET || "",
    completeStatuses: parseCompleteStatuses(process.env.CLICKUP_COMPLETE_STATUSES),
  },
  slack: {
    // Prefer the bot token (chat.postMessage) when present, else incoming webhook URL.
    botToken: process.env.SLACK_BOT_TOKEN || "",
    webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    channel: process.env.SLACK_CHANNEL || "#all-cadral",
  },
  port: Number(process.env.PORT) || 3000,
};

/**
 * Validate that the given required config keys are present.
 * `needs` is a list of one of: "clickupToken", "clickupList", "slack".
 * Returns an array of human-readable error strings (empty when all good).
 */
export function validateConfig(needs = []) {
  const errors = [];

  if (needs.includes("clickupToken") && !config.clickup.apiToken) {
    errors.push("CLICKUP_API_TOKEN is required (your ClickUp personal API token).");
  }
  if (needs.includes("clickupList") && !config.clickup.listId) {
    errors.push("CLICKUP_LIST_ID is required (the list where tasks are created).");
  }
  if (needs.includes("slack") && !config.slack.botToken && !config.slack.webhookUrl) {
    errors.push(
      "Slack config missing: set SLACK_BOT_TOKEN (preferred) or SLACK_WEBHOOK_URL."
    );
  }

  return errors;
}

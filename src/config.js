// Central configuration: reads and validates environment variables.
// All secrets/IDs come from the environment — nothing is hardcoded.
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

// Repo root (one level up from src/), used to resolve default file paths.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Default bot scopes requested during the Slack OAuth v2 flow.
const DEFAULT_SLACK_OAUTH_SCOPES = "chat:write,chat:write.public";

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
    // Optional "Connect with Slack" OAuth v2 flow. When clientId/clientSecret
    // are set, a workspace can authorize the app at /slack/install and the
    // resulting bot token is stored and used automatically by notify().
    oauth: {
      clientId: process.env.SLACK_CLIENT_ID || "",
      clientSecret: process.env.SLACK_CLIENT_SECRET || "",
      // Optional; kept for future request-signature verification.
      signingSecret: process.env.SLACK_SIGNING_SECRET || "",
      // Optional; if unset, derived from the request host at callback time.
      redirectUri: process.env.SLACK_REDIRECT_URI || "",
      scopes: process.env.SLACK_OAUTH_SCOPES || DEFAULT_SLACK_OAUTH_SCOPES,
      tokenStorePath:
        process.env.SLACK_TOKEN_STORE ||
        path.join(REPO_ROOT, ".slack-tokens.json"),
    },
  },
  port: Number(process.env.PORT) || 3000,
};

/**
 * Validate that the given required config keys are present.
 * `needs` is a list of one of: "clickupToken", "clickupList", "slack",
 * "slackOAuth".
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
  if (
    needs.includes("slackOAuth") &&
    (!config.slack.oauth.clientId || !config.slack.oauth.clientSecret)
  ) {
    errors.push(
      "Slack OAuth not configured: set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET."
    );
  }

  return errors;
}

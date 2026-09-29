// Express router implementing the Slack "Connect with Slack" OAuth v2 flow.
// GET /slack/install         -> redirect to Slack's authorize page.
// GET /slack/oauth/callback  -> exchange the code and store the bot token.
import crypto from "node:crypto";
import { Router } from "express";
import { config, validateConfig } from "./config.js";
import { saveInstallation } from "./tokenStore.js";

export const slackOAuthRouter = Router();

const AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const ACCESS_URL = "https://slack.com/api/oauth.v2.access";

// How long a generated OAuth `state` value stays valid (10 minutes).
const STATE_TTL_MS = 10 * 60 * 1000;

// In-memory state store: state string -> expiry timestamp (ms).
const pendingStates = new Map();

// Drop expired state entries so the map doesn't grow unbounded.
function pruneStates() {
  const now = Date.now();
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state);
  }
}

// Create, remember, and return a fresh random state value.
function createState() {
  pruneStates();
  const state = crypto.randomBytes(24).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  return state;
}

// Consume a state value: true only if present and not expired.
function consumeState(state) {
  pruneStates();
  if (!state || !pendingStates.has(state)) return false;
  const expiresAt = pendingStates.get(state);
  pendingStates.delete(state);
  return expiresAt > Date.now();
}

// Minimal HTML escaping for values interpolated into response pages.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Wrap body content in a tiny self-contained HTML page.
function htmlPage(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; line-height: 1.5;">
${bodyHtml}
</body>
</html>`;
}

// Resolve the redirect URI: explicit config wins, else derive from the request.
function resolveRedirectUri(req) {
  if (config.slack.oauth.redirectUri) return config.slack.oauth.redirectUri;
  return `${req.protocol}://${req.get("host")}/slack/oauth/callback`;
}

// Guard: ensure OAuth is configured; otherwise respond with a helpful page.
function ensureConfigured(res) {
  const errors = validateConfig(["slackOAuth"]);
  if (errors.length) {
    res
      .status(503)
      .type("html")
      .send(
        htmlPage(
          "Slack OAuth not configured",
          `<h1>Slack OAuth is not configured</h1>
<p>This app isn't set up for the "Connect with Slack" flow yet.</p>
<p>Set <code>SLACK_CLIENT_ID</code> and <code>SLACK_CLIENT_SECRET</code> in the
environment (from your Slack app's <strong>Basic Information</strong> page),
then restart the server.</p>`
        )
      );
    return false;
  }
  return true;
}

slackOAuthRouter.get("/slack/install", (req, res) => {
  if (!ensureConfigured(res)) return;

  const state = createState();
  const params = new URLSearchParams({
    client_id: config.slack.oauth.clientId,
    scope: config.slack.oauth.scopes,
    redirect_uri: resolveRedirectUri(req),
    state,
  });

  res.redirect(302, `${AUTHORIZE_URL}?${params.toString()}`);
});

slackOAuthRouter.get("/slack/oauth/callback", async (req, res) => {
  if (!ensureConfigured(res)) return;

  const { code, state, error: slackError } = req.query;

  // The user may have denied the authorization.
  if (slackError) {
    return res
      .status(400)
      .type("html")
      .send(
        htmlPage(
          "Slack connection failed",
          `<h1>Connection failed</h1><p>Slack returned: <code>${escapeHtml(
            slackError
          )}</code></p>`
        )
      );
  }

  // Validate state to defend against CSRF and stale/forged callbacks.
  if (!consumeState(typeof state === "string" ? state : "")) {
    return res
      .status(400)
      .type("html")
      .send(
        htmlPage(
          "Invalid or expired request",
          `<h1>Invalid or expired request</h1>
<p>The authorization state was unknown or has expired. Please
<a href="/slack/install">try connecting again</a>.</p>`
        )
      );
  }

  if (!code || typeof code !== "string") {
    return res
      .status(400)
      .type("html")
      .send(
        htmlPage(
          "Missing authorization code",
          `<h1>Missing authorization code</h1><p>No <code>code</code> was
provided by Slack. Please <a href="/slack/install">try again</a>.</p>`
        )
      );
  }

  try {
    const form = new URLSearchParams({
      client_id: config.slack.oauth.clientId,
      client_secret: config.slack.oauth.clientSecret,
      code,
      redirect_uri: resolveRedirectUri(req),
    });

    const resp = await fetch(ACCESS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data.ok) {
      const detail = data.error || `HTTP ${resp.status}`;
      return res
        .status(400)
        .type("html")
        .send(
          htmlPage(
            "Slack connection failed",
            `<h1>Connection failed</h1><p>Slack returned: <code>${escapeHtml(
              detail
            )}</code></p><p><a href="/slack/install">Try again</a></p>`
          )
        );
    }

    // Persist the installation. Do NOT log the token.
    saveInstallation({
      team: data.team,
      botToken: data.access_token,
      botUserId: data.bot_user_id,
      scope: data.scope,
      authedUser: data.authed_user,
      installedAt: new Date().toISOString(),
    });

    const teamName = data.team?.name || "your workspace";
    console.log(`[slackOAuth] Installed to team ${data.team?.id || "(unknown)"}.`);

    return res.type("html").send(
      htmlPage(
        "Connected to Slack",
        `<h1>✅ Connected to Slack workspace ${escapeHtml(teamName)}.</h1>
<p>You can close this window.</p>`
      )
    );
  } catch (err) {
    console.error("[slackOAuth] Token exchange failed:", err.message);
    return res
      .status(500)
      .type("html")
      .send(
        htmlPage(
          "Slack connection error",
          `<h1>Something went wrong</h1><p>Could not complete the Slack
connection. Please <a href="/slack/install">try again</a>.</p>`
        )
      );
  }
});

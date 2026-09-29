// Express server: health check + ClickUp webhook endpoint.
import express from "express";
import { config, validateConfig } from "./config.js";
import { webhookRouter } from "./webhook.js";
import { slackOAuthRouter } from "./slackOAuth.js";

// Validate the env vars this service needs at startup.
// The webhook flow needs a ClickUp token (to fetch task details) and Slack.
const errors = validateConfig(["clickupToken", "slack"]);
if (errors.length) {
  console.error("Configuration error(s):");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nCopy .env.example to .env and fill in the values, then restart.");
  process.exit(1);
}

const app = express();

// Capture the raw body so we can verify the ClickUp HMAC signature.
// express.json still parses req.body as usual.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(webhookRouter);

// "Connect with Slack" OAuth v2 routes. These self-report when OAuth isn't
// configured (helpful HTML page) rather than depending on startup validation.
app.use(slackOAuthRouter);

app.listen(config.port, () => {
  console.log(`cadral-clickup-slack listening on port ${config.port}`);
  console.log(`  Health:  GET  /health`);
  console.log(`  Webhook: POST /clickup/webhook`);
  console.log(`  Connect: GET  /slack/install`);
  console.log(`  Slack target: ${config.slack.channel}`);
});

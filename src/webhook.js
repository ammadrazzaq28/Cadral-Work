// Express router handling ClickUp webhook events and notifying Slack.
import crypto from "node:crypto";
import { Router } from "express";
import { config } from "./config.js";
import { getTask } from "./clickup.js";
import { notify, buildCompletionMessage } from "./slack.js";

export const webhookRouter = Router();

/**
 * Verify the ClickUp X-Signature header (HMAC-SHA256 of the raw request body).
 * Returns true when the secret is unset (verification skipped) or the signature
 * matches; false only when a secret is set and the signature is wrong/missing.
 */
function verifySignature(req) {
  const secret = config.clickup.webhookSecret;
  if (!secret) {
    console.warn(
      "[webhook] CLICKUP_WEBHOOK_SECRET not set — skipping signature verification."
    );
    return true;
  }

  const provided = req.get("X-Signature");
  if (!provided) return false;

  // req.rawBody is populated by the raw-body capture in server.js.
  const raw = req.rawBody || Buffer.from("");
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");

  // Constant-time comparison; guard against unequal lengths.
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Decide whether a status name/type represents completion.
 * A ClickUp status object looks like { status: "done", type: "closed", ... }.
 */
function isCompleteStatus(statusName, statusType) {
  const type = (statusType || "").toLowerCase();
  if (type === "closed" || type === "done") return true;

  const name = (statusName || "").toLowerCase();
  return config.clickup.completeStatuses.includes(name);
}

/**
 * Inspect a ClickUp webhook payload and extract completion info if the event
 * represents a task moving into a completed status.
 * @returns {{ completed: boolean, statusName?: string, completedBy?: string }}
 */
function detectCompletion(body) {
  // Case 1: history_items carry the status change (taskStatusUpdated).
  const historyItems = Array.isArray(body?.history_items) ? body.history_items : [];
  for (const item of historyItems) {
    if (item?.field !== "status") continue;
    const after = item?.after; // { status, type } or a string
    const statusName = typeof after === "string" ? after : after?.status;
    const statusType = typeof after === "object" ? after?.type : undefined;
    if (isCompleteStatus(statusName, statusType)) {
      const completedBy = item?.user?.username || item?.user?.email;
      return { completed: true, statusName, completedBy };
    }
  }

  // Case 2: a top-level status object on the payload.
  const status = body?.payload?.status || body?.status;
  if (status) {
    const statusName = typeof status === "string" ? status : status?.status;
    const statusType = typeof status === "object" ? status?.type : undefined;
    if (isCompleteStatus(statusName, statusType)) {
      return { completed: true, statusName };
    }
  }

  return { completed: false };
}

webhookRouter.post("/clickup/webhook", async (req, res) => {
  // 1. Verify signature before trusting anything.
  if (!verifySignature(req)) {
    console.warn("[webhook] Invalid or missing X-Signature — rejecting.");
    return res.status(401).json({ ok: false, error: "invalid signature" });
  }

  // 2. Parse the payload defensively; never crash on a bad body.
  let body;
  try {
    body = req.body && typeof req.body === "object" ? req.body : {};
  } catch (err) {
    console.error("[webhook] Failed to read body:", err);
    return res.status(400).json({ ok: false, error: "bad payload" });
  }

  const event = body?.event || "unknown";
  const taskId = body?.task_id || body?.payload?.id;

  // 3. Respond quickly; do the Slack work but don't let errors 500 the webhook.
  try {
    const { completed, statusName, completedBy } = detectCompletion(body);

    if (!completed) {
      console.log(`[webhook] Event "${event}" (task ${taskId}) — not a completion.`);
      return res.status(200).json({ ok: true, handled: false });
    }

    // Enrich with task details (name + url) when we have a task id.
    let name = body?.payload?.name;
    let url = body?.payload?.url;
    let resolvedBy = completedBy;

    if (taskId && (!name || !url)) {
      try {
        const task = await getTask(taskId);
        name = name || task?.name;
        url = url || task?.url;
      } catch (err) {
        console.error(`[webhook] Could not fetch task ${taskId}:`, err.message);
      }
    }
    if (!url && taskId) url = `https://app.clickup.com/t/${taskId}`;

    const { text, blocks } = buildCompletionMessage({
      name,
      url,
      completedBy: resolvedBy,
      status: statusName,
    });
    await notify(text, blocks);

    console.log(`[webhook] Notified Slack: task ${taskId} completed (${statusName}).`);
    return res.status(200).json({ ok: true, handled: true });
  } catch (err) {
    // Log but still return 200 so ClickUp doesn't hammer us with retries.
    console.error("[webhook] Error handling completion:", err);
    return res.status(200).json({ ok: true, handled: false, error: err.message });
  }
});

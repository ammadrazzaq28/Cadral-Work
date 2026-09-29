// Minimal ClickUp API client built on the built-in fetch (Node 18+).
import { config } from "./config.js";

const BASE_URL = "https://api.clickup.com/api/v2";

/**
 * Perform an authenticated ClickUp API request and return parsed JSON.
 * Throws a descriptive error on any non-2xx response.
 */
async function clickupFetch(path, options = {}) {
  const token = config.clickup.apiToken;
  if (!token) {
    throw new Error("CLICKUP_API_TOKEN is not set — cannot call the ClickUp API.");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: token, // ClickUp uses the raw token (no "Bearer" prefix).
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const bodyText = await res.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }

  if (!res.ok) {
    const detail = body?.err || body?.error || body?.raw || JSON.stringify(body);
    throw new Error(`ClickUp API error ${res.status} on ${path}: ${detail}`);
  }

  return body;
}

/**
 * Create a task in the configured ClickUp list.
 * @param {object} opts
 * @param {string} opts.name         - Task title (required).
 * @param {string} [opts.description]
 * @param {number[]} [opts.assignees] - Array of ClickUp user IDs.
 * @param {number} [opts.dueDate]     - Unix epoch milliseconds.
 * @param {number} [opts.priority]    - 1 (urgent) .. 4 (low).
 * @param {string} [opts.status]      - Status name within the list.
 * @returns {Promise<object>} The created task object from ClickUp.
 */
export async function createTask({ name, description, assignees, dueDate, priority, status } = {}) {
  if (!name || !name.trim()) {
    throw new Error("createTask requires a non-empty task name.");
  }
  const listId = config.clickup.listId;
  if (!listId) {
    throw new Error("CLICKUP_LIST_ID is not set — cannot create a task.");
  }

  // Only include fields that were provided so we don't send nulls.
  const payload = { name };
  if (description !== undefined) payload.description = description;
  if (Array.isArray(assignees) && assignees.length) payload.assignees = assignees;
  if (dueDate !== undefined) payload.due_date = dueDate;
  if (priority !== undefined) payload.priority = priority;
  if (status !== undefined) payload.status = status;

  return clickupFetch(`/list/${encodeURIComponent(listId)}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single task by id.
 * @param {string} taskId
 * @returns {Promise<object>}
 */
export async function getTask(taskId) {
  if (!taskId) throw new Error("getTask requires a task id.");
  return clickupFetch(`/task/${encodeURIComponent(taskId)}`);
}

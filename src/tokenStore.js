// Persists Slack OAuth installations in a simple JSON file, keyed by team id.
// Never commit the store file — it contains bot tokens (see .gitignore).
import fs from "node:fs";
import { config } from "./config.js";

/**
 * Read and parse the token store file. Returns an object keyed by team id.
 * Missing or unreadable/corrupt files yield an empty object (no throw).
 */
function readStore() {
  const filePath = config.slack.oauth.tokenStorePath;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    if (err.code === "ENOENT") return {};
    console.error(`[tokenStore] Could not read ${filePath}:`, err.message);
    return {};
  }
}

// Write the store object back to disk (pretty-printed).
function writeStore(store) {
  const filePath = config.slack.oauth.tokenStorePath;
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Persist a Slack installation. Keyed by installation.team.id.
 * Stores { team, botToken, botUserId, scope, authedUser, installedAt }.
 * @returns {object} the stored installation record.
 */
export function saveInstallation(installation) {
  const teamId = installation?.team?.id;
  if (!teamId) throw new Error("saveInstallation requires installation.team.id");

  const record = {
    team: installation.team,
    botToken: installation.botToken || "",
    botUserId: installation.botUserId || "",
    scope: installation.scope || "",
    authedUser: installation.authedUser || null,
    installedAt: installation.installedAt || new Date().toISOString(),
  };

  const store = readStore();
  store[teamId] = record;
  writeStore(store);
  return record;
}

/**
 * Look up a stored installation by team id.
 * @returns {object|null} the installation, or null if not found.
 */
export function getInstallation(teamId) {
  if (!teamId) return null;
  const store = readStore();
  return store[teamId] || null;
}

/**
 * Return the most recently installed workspace (by installedAt), or null when
 * the store is empty. Useful when no specific team id is known.
 */
export function getFirstInstallation() {
  const store = readStore();
  const records = Object.values(store);
  if (!records.length) return null;
  records.sort(
    (a, b) =>
      new Date(b.installedAt || 0).getTime() - new Date(a.installedAt || 0).getTime()
  );
  return records[0];
}

// CLI to create a ClickUp task in the configured list.
// Usage: node src/createTask.js "Task name" [--description "..."] [--assignee 123]
//        [--due 2026-01-31] [--priority 2]
import { config, validateConfig } from "./config.js";
import { createTask } from "./clickup.js";

const HELP = `
Create a ClickUp task in the configured list.

Usage:
  npm run create-task -- "Task name" [options]
  node src/createTask.js "Task name" [options]

Options:
  --description, -d <text>   Task description.
  --assignee, -a <userId>    ClickUp user id to assign. Repeat for multiple.
  --due <date>               Due date (ISO e.g. 2026-01-31 or epoch ms).
  --priority, -p <1-4>       Priority: 1=urgent, 2=high, 3=normal, 4=low.
  --status, -s <name>        Status name within the list.
  --help, -h                 Show this help.

Required env vars: CLICKUP_API_TOKEN, CLICKUP_LIST_ID (see .env.example).
`;

/** Parse argv into { name, description, assignees, dueDate, priority, status }. */
function parseArgs(argv) {
  const out = { assignees: [] };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--description":
      case "-d":
        out.description = argv[++i];
        break;
      case "--assignee":
      case "-a": {
        const id = Number(argv[++i]);
        if (!Number.isNaN(id)) out.assignees.push(id);
        break;
      }
      case "--due":
        out.due = argv[++i];
        break;
      case "--priority":
      case "-p":
        out.priority = Number(argv[++i]);
        break;
      case "--status":
      case "-s":
        out.status = argv[++i];
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          out.help = true;
        } else {
          positional.push(arg);
        }
    }
  }

  out.name = positional.join(" ").trim();
  return out;
}

/** Convert a due-date arg (ISO string or epoch ms) to epoch milliseconds. */
function toEpochMs(due) {
  if (!due) return undefined;
  if (/^\d+$/.test(due)) return Number(due); // already epoch ms
  const ms = Date.parse(due);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid --due date: "${due}" (use ISO date or epoch ms).`);
  }
  return ms;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.name) {
    console.log(HELP);
    process.exit(args.name ? 0 : 1);
  }

  // Validate the env vars this command needs.
  const errors = validateConfig(["clickupToken", "clickupList"]);
  if (errors.length) {
    console.error("Configuration error(s):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const task = await createTask({
    name: args.name,
    description: args.description,
    assignees: args.assignees.length ? args.assignees : undefined,
    dueDate: toEpochMs(args.due),
    priority: args.priority,
    status: args.status,
  });

  console.log("Created ClickUp task:");
  console.log(`  id:  ${task.id}`);
  console.log(`  url: ${task.url || `https://app.clickup.com/t/${task.id}`}`);
  console.log(`  list: ${config.clickup.listId}`);
}

main().catch((err) => {
  console.error(`Failed to create task: ${err.message}`);
  process.exit(1);
});

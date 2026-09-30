import { config } from "dotenv";
import { clearCommands } from "./features/deploy/deployCommands.js";
import { createLogger } from "./utils/logger.js";

// Load environment variables from a .env file.
config();

const log = createLogger("clear-cli");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  log.error("clear requires DISCORD_TOKEN and CLIENT_ID in your .env.");
  process.exit(1);
}

/**
 * Decide the scope:
 * - `npm run clear`               -> clears GLOBAL commands
 * - `npm run clear -- --guild`    -> clears the guild from GUILD_ID
 * - `npm run clear -- --guild=ID` -> clears the given guild id
 */
function resolveGuildId(): string | undefined {
  const arg = process.argv.find(
    (a) => a === "--guild" || a.startsWith("--guild="),
  );
  if (!arg) return undefined; // no flag -> global

  const explicit = arg.includes("=") ? arg.split("=")[1] : undefined;
  const guildId = explicit || process.env.GUILD_ID;

  if (!guildId) {
    log.error(
      "--guild was given but no guild id found (pass --guild=<id> or set GUILD_ID).",
    );
    process.exit(1);
  }
  return guildId;
}

async function main(): Promise<void> {
  const guildId = resolveGuildId();
  try {
    await clearCommands({ token: token!, clientId: clientId!, guildId });
  } catch (error) {
    log.error("Failed to clear commands:", error);
    process.exit(1);
  }
}

main();

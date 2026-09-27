import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { loadButtons } from "./loaders/loadButtons.js";
import { loadCommands } from "./loaders/loadCommands.js";
import { loadEvents } from "./loaders/loadEvents.js";
import { loadModals } from "./loaders/loadModals.js";
import { BaoBaoClient } from "./structures/BaoBaoClient.js";
import { createLogger } from "./utils/logger.js";

// Load environment variables from a .env file.
config();

const log = createLogger("boot");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  log.error(
    "Missing DISCORD_TOKEN. Copy .env.example to .env and set your bot token.",
  );
  process.exit(1);
}

// Resolve __dirname in an ES module context.
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create the Discord client with the intents the bot needs.
 * Only `Guilds` is required for slash commands and the ready event.
 */
const client = new BaoBaoClient({
  intents: [GatewayIntentBits.Guilds],
});

/** Track shutdown so we only run it once even if multiple signals arrive. */
let shuttingDown = false;

/** Cleanly destroy the client and exit. */
async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  log.info(`Shutting down (${reason})...`);
  try {
    await client.destroy();
    log.info("Client destroyed. Goodbye!");
  } catch (error) {
    log.error("Error during shutdown:", error);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

/** Register process-level handlers for signals and fatal errors. */
function registerProcessHandlers(): void {
  // Graceful shutdown on termination signals.
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  // Last-resort safety nets: log, then shut down.
  process.on("unhandledRejection", (reason) => {
    log.error("Unhandled promise rejection:", reason);
  });
  process.on("uncaughtException", (error) => {
    log.error("Uncaught exception:", error);
    void shutdown("uncaughtException", 1);
  });
}

async function main(): Promise<void> {
  registerProcessHandlers();

  const commandCount = await loadCommands(client, join(__dirname, "commands"));
  const buttonCount = await loadButtons(client, join(__dirname, "buttons"));
  const modalCount = await loadModals(client, join(__dirname, "modals"));
  const eventCount = await loadEvents(client, join(__dirname, "events"));
  log.info(
    `Loaded ${commandCount} command(s), ${buttonCount} button(s), ${modalCount} modal(s), and ${eventCount} event(s).`,
  );

  await client.login(token);
}

main().catch((error) => {
  log.error("Failed to start the bot:", error);
  process.exit(1);
});

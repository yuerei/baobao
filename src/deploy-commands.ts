import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { deployCommands } from "./features/deploy/deployCommands.js";
import { loadCommands } from "./loaders/loadCommands.js";
import { BaoBaoClient } from "./structures/BaoBaoClient.js";
import { createLogger } from "./utils/logger.js";

// Load environment variables from a .env file.
config();

const log = createLogger("deploy-cli");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional

if (!token || !clientId) {
  log.error("deploy requires DISCORD_TOKEN and CLIENT_ID in your .env.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  // Reuse the command loader so deployment stays in sync with runtime.
  const client = new BaoBaoClient({ intents: [] });
  await loadCommands(client, join(__dirname, "commands"));

  try {
    await deployCommands(client, {
      token: token!,
      clientId: clientId!,
      guildId,
    });
  } catch (error) {
    log.error("Failed to deploy commands:", error);
    process.exit(1);
  }
}

main();

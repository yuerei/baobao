import { ActivityType, Events } from "discord.js";
import { deployCommands } from "../features/deploy/deployCommands.js";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import { defineEvent } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ready");

/**
 * The `ready` (ClientReady) event fires once when the bot has successfully
 * logged in and is ready to start receiving other events.
 */
export default defineEvent({
  name: Events.ClientReady,
  once: true,
  execute: async (readyClient) => {
    // readyClient is Client<true>, so `.user` is guaranteed non-null.
    // Cast to our subclass to reach `.commands` for deployment.
    const client = readyClient as BaoBaoClient & typeof readyClient;

    log.info(`Logged in as ${client.user.tag}`);
    log.info(`Serving ${client.guilds.cache.size} guild(s)`);

    // Set a simple presence so the bot shows an activity in Discord.
    client.user.setPresence({
      status: "online",
      activities: [{ name: "with discord.js", type: ActivityType.Playing }],
    });

    // Auto-deploy slash commands on startup unless explicitly disabled.
    // Set AUTO_DEPLOY=false in your .env to skip (e.g. to avoid rate limits
    // when restarting frequently).
    const autoDeploy =
      (process.env.AUTO_DEPLOY ?? "true").toLowerCase() !== "false";
    if (!autoDeploy) {
      log.info("AUTO_DEPLOY is disabled; skipping command registration.");
      return;
    }

    const token = process.env.DISCORD_TOKEN;
    const guildId = process.env.GUILD_ID; // optional
    // client.application.id is available once ready, so CLIENT_ID isn't required.
    const clientId = client.application?.id ?? process.env.CLIENT_ID;

    if (!token || !clientId) {
      log.warn("Skipping auto-deploy: missing token or application id.");
      return;
    }

    try {
      const count = await deployCommands(client, { token, clientId, guildId });
      log.info(`Auto-deploy complete (${count} command(s)).`);
    } catch (error) {
      // Non-fatal: the bot still runs; commands just may be stale.
      log.error("Auto-deploy failed (bot will continue running):", error);
    }
  },
});

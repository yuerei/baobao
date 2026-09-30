import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { deployCommands } from "../../features/deploy/deployCommands.js";
import {
  reloadAll,
  reloadTarget,
  type ReloadResult,
  type ReloadTarget,
} from "../../features/reload/reload.js";
import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import { defineCommand } from "../../types/Command.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("reload");

/**
 * /reload — owner-only. Hot-reloads handler modules (commands, buttons, select
 * menus, modals) from disk without restarting the bot. When commands are
 * reloaded, they're re-deployed to Discord so signature changes take effect.
 *
 * Events are not reloadable (re-registering would duplicate listeners); restart
 * the bot to change those.
 */
export default defineCommand({
  category: "Owner",
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Hot-reload bot handlers from disk (owner only).")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("What to reload (defaults to all).")
        .setRequired(false)
        .addChoices(
          { name: "All", value: "all" },
          { name: "Commands", value: "commands" },
          { name: "Buttons", value: "buttons" },
          { name: "Select menus", value: "selectMenus" },
          { name: "Modals", value: "modals" },
        ),
    ),
  execute: async (interaction) => {
    const client = interaction.client as BaoBaoClient;
    const type = (interaction.options.getString("type") ?? "all") as
      | ReloadTarget
      | "all";

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const results: ReloadResult[] =
        type === "all"
          ? await reloadAll(client)
          : [await reloadTarget(client, type)];

      // If commands changed, re-deploy them to Discord so the slash-command
      // definitions stay in sync.
      const commandsReloaded = results.some((r) => r.target === "commands");
      let deployNote = "";
      if (commandsReloaded) {
        const token = process.env.DISCORD_TOKEN;
        const clientId = client.application?.id ?? process.env.CLIENT_ID;
        const guildId = process.env.GUILD_ID;
        if (token && clientId) {
          try {
            await deployCommands(client, { token, clientId, guildId });
            deployNote = guildId
              ? "\nRe-deployed commands to the dev guild (instant)."
              : "\nRe-deployed commands globally (may take up to ~1h to update).";
          } catch (error) {
            log.error("Re-deploy after reload failed:", error);
            deployNote =
              "\n⚠️ Reloaded, but re-deploying commands to Discord failed (see logs).";
          }
        } else {
          deployNote =
            "\n⚠️ Reloaded, but couldn't re-deploy (missing token/client id).";
        }
      }

      const summary = results
        .map((r) => `• **${r.target}**: ${r.count}`)
        .join("\n");
      log.info(
        `Reloaded by ${interaction.user.tag}: ${results.map((r) => `${r.target}=${r.count}`).join(", ")}`,
      );

      await interaction.editReply({
        content: `♻️ Reload complete.\n${summary}${deployNote}`,
      });
    } catch (error) {
      log.error("Reload failed:", error);
      await interaction.editReply({
        content: "Something went wrong during reload. Check the logs.",
      });
    }
  },
});

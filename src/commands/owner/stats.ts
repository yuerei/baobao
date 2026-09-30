import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  version,
} from "discord.js";
import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import { defineCommand } from "../../types/Command.js";

/** Format a duration in seconds as e.g. "1d 2h 3m 4s". */
function formatUptime(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`]
    .filter(Boolean)
    .join(" ");
}

/**
 * /stats — owner-only diagnostics: uptime, guild/user counts, memory, versions.
 */
export default defineCommand({
  category: "Owner",
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show bot diagnostics (owner only)."),
  execute: async (interaction) => {
    const client = interaction.client as BaoBaoClient;
    const memoryMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    const embed = new EmbedBuilder()
      .setTitle("📊 Bot Stats")
      .setColor(0x5865f2)
      .addFields(
        { name: "Uptime", value: formatUptime(process.uptime()), inline: true },
        { name: "Guilds", value: `${client.guilds.cache.size}`, inline: true },
        { name: "Commands", value: `${client.commands.size}`, inline: true },
        { name: "Memory (RSS)", value: `${memoryMb} MB`, inline: true },
        { name: "discord.js", value: `v${version}`, inline: true },
        { name: "Node", value: process.version, inline: true },
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
});

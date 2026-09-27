import { SlashCommandBuilder } from "discord.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /server — shows basic information about the current guild.
 */
export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Show information about this server."),
  execute: async (interaction) => {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used inside a server.",
        ephemeral: true,
      });
      return;
    }

    const { guild } = interaction;
    await interaction.reply(
      [
        `**${guild.name}**`,
        `> Members: **${guild.memberCount}**`,
        `> Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
      ].join("\n"),
    );
  },
});

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /panel — sends a message with buttons that exercise both routing styles:
 * an exact-match "confirm" button and a prefix-match "counter:0" button.
 */
export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Show a demo panel with interactive buttons."),
  execute: async (interaction) => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("counter:0")
        .setLabel("Count: 0")
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({
      content: "Here's a demo panel — try the buttons:",
      components: [row],
    });
  },
});

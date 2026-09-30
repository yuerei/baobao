import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /menu — posts a demo string select menu. Selecting an option is routed to
 * the "demo:select" select-menu handler.
 */
export default defineCommand({
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Show a demo select menu."),
  execute: async (interaction) => {
    const select = new StringSelectMenuBuilder()
      .setCustomId("demo:select")
      .setPlaceholder("Pick one or more...")
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Red")
          .setValue("red")
          .setEmoji("🔴"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Green")
          .setValue("green")
          .setEmoji("🟢"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Blue")
          .setValue("blue")
          .setEmoji("🔵"),
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );

    await interaction.reply({
      content: "Here's a demo select menu — pick something:",
      components: [row],
    });
  },
});

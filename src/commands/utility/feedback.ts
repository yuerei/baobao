import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /feedback — opens a modal form. The submission is routed to the "feedback"
 * modal handler by matching customIds.
 */
export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Open a form to send feedback."),
  execute: async (interaction) => {
    const subject = new TextInputBuilder()
      .setCustomId("subject")
      .setLabel("Subject")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const details = new TextInputBuilder()
      .setCustomId("details")
      .setLabel("Details")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    const modal = new ModalBuilder()
      .setCustomId("feedback")
      .setTitle("Send Feedback")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(subject),
        new ActionRowBuilder<TextInputBuilder>().addComponents(details),
      );

    await interaction.showModal(modal);
  },
});

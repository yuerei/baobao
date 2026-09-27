import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { CTF_CREATE_BUTTON_ID } from "../../features/ctf/constants.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /ctf-setup — posts a permanent panel with a "Create CTF" button.
 *
 * The panel message stays in the channel indefinitely. Because the button is
 * routed by its customId (not by an in-memory collector), it keeps working
 * across bot restarts.
 */
export default defineCommand({
  category: "CTF",
  data: new SlashCommandBuilder()
    .setName("ctf-setup")
    .setDescription("Post a permanent panel for creating CTF channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  execute: async (interaction) => {
    // Belt-and-suspenders: also enforce at runtime.
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This command can only be used inside a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🚩 CTF Panel")
      .setDescription(
        [
          "Click the button below to spin up a new channel for a CTF.",
          "",
          "You'll be asked for the CTF name, CTFtime link, and other details.",
          "A new channel will be created **in this category** with all the info pinned in the first message.",
        ].join("\n"),
      )
      .setColor(0x5865f2);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(CTF_CREATE_BUTTON_ID)
        .setLabel("Create CTF")
        .setEmoji("🚩")
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
});

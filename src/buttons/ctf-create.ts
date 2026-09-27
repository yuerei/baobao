import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  CTF_CREATE_BUTTON_ID,
  CTF_FIELDS,
  CTF_MODAL_ID,
} from "../features/ctf/constants.js";
import { defineButton } from "../types/Button.js";

/**
 * Handles the "Create CTF" button on the permanent panel by showing a modal
 * that collects the CTF's details. (Discord allows at most 5 modal inputs.)
 */
export default defineButton({
  customId: CTF_CREATE_BUTTON_ID,
  execute: async (interaction) => {
    const name = new TextInputBuilder()
      .setCustomId(CTF_FIELDS.name)
      .setLabel("CTF name")
      .setPlaceholder("e.g. picoCTF 2026")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const ctftime = new TextInputBuilder()
      .setCustomId(CTF_FIELDS.ctftime)
      .setLabel("CTFtime link")
      .setPlaceholder("https://ctftime.org/event/1234")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(300)
      .setRequired(false);

    const dates = new TextInputBuilder()
      .setCustomId(CTF_FIELDS.dates)
      .setLabel("Dates")
      .setPlaceholder("e.g. Fri 18:00 UTC – Sun 18:00 UTC")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(200)
      .setRequired(false);

    const access = new TextInputBuilder()
      .setCustomId(CTF_FIELDS.access)
      .setLabel("Team Access (Creds / Token)")
      .setPlaceholder("Username / password, invite link, or team token")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(false);

    const description = new TextInputBuilder()
      .setCustomId(CTF_FIELDS.description)
      .setLabel("Notes / description")
      .setPlaceholder("Website, format, scoring, or anything else")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(2000)
      .setRequired(false);

    const modal = new ModalBuilder()
      .setCustomId(CTF_MODAL_ID)
      .setTitle("Create a CTF")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(name),
        new ActionRowBuilder<TextInputBuilder>().addComponents(ctftime),
        new ActionRowBuilder<TextInputBuilder>().addComponents(dates),
        new ActionRowBuilder<TextInputBuilder>().addComponents(access),
        new ActionRowBuilder<TextInputBuilder>().addComponents(description),
      );

    await interaction.showModal(modal);
  },
});

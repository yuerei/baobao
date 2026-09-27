import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { defineButton } from "../types/Button.js";

/**
 * Prefix-match button: handles any customId starting with "counter:".
 *
 * The current count is encoded after the prefix, e.g. "counter:3". This shows
 * how to carry state in the customId and rebuild the component on each click.
 */
export default defineButton({
  prefix: "counter:",
  execute: async (interaction) => {
    // customId looks like "counter:<n>" — parse the current value.
    const raw = interaction.customId.slice("counter:".length);
    const current = Number.parseInt(raw, 10);
    const next = Number.isNaN(current) ? 1 : current + 1;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`counter:${next}`)
        .setLabel(`Count: ${next}`)
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.update({
      content: "Click to increment:",
      components: [row],
    });
  },
});

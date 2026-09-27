import { MessageFlags } from "discord.js";
import { defineButton } from "../types/Button.js";

/**
 * Exact-match button: handles a button whose customId is exactly "confirm".
 */
export default defineButton({
  customId: "confirm",
  execute: async (interaction) => {
    await interaction.reply({
      content: "✅ Confirmed!",
      flags: MessageFlags.Ephemeral,
    });
  },
});

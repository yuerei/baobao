import { MessageFlags } from "discord.js";
import { defineSelectMenu } from "../types/SelectMenu.js";

/**
 * Exact-match string select menu ("demo:select"). Echoes the chosen value(s)
 * back to the user. Demonstrates reading `interaction.values`.
 */
export default defineSelectMenu({
  customId: "demo:select",
  execute: async (interaction) => {
    // For string selects, the chosen option values are on `interaction.values`.
    const chosen = interaction.isStringSelectMenu() ? interaction.values : [];

    await interaction.reply({
      content:
        chosen.length > 0
          ? `You selected: ${chosen.map((v) => `\`${v}\``).join(", ")}`
          : "You didn't select anything.",
      flags: MessageFlags.Ephemeral,
    });
  },
});

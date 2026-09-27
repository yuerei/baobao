import { MessageFlags } from "discord.js";
import { defineModal } from "../types/Modal.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("feedback");

/**
 * Exact-match modal: handles the submission of the modal whose customId is
 * "feedback". Reads the text-input fields by their own customIds.
 */
export default defineModal({
  customId: "feedback",
  execute: async (interaction) => {
    const subject = interaction.fields.getTextInputValue("subject");
    const details = interaction.fields.getTextInputValue("details");

    log.info(`from ${interaction.user.tag}: ${subject} — ${details}`);

    await interaction.reply({
      content: `Thanks for your feedback on **${subject}**! 📝`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

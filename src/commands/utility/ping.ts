import { SlashCommandBuilder } from "discord.js";
import { defineCommand } from "../../types/Command.js";

/**
 * /ping — replies with the bot's websocket and round-trip latency.
 */
export default defineCommand({
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency."),
  execute: async (interaction) => {
    const sent = await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    });

    const roundTrip =
      (sent.resource?.message?.createdTimestamp ?? Date.now()) -
      interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 Pong!\n> Round-trip: **${roundTrip}ms**\n> WebSocket: **${wsPing}ms**`,
    );
  },
});

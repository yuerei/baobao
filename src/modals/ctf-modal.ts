import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { buildArchiveRow } from "../features/ctf/components.js";
import { CTF_FIELDS, CTF_MODAL_ID } from "../features/ctf/constants.js";
import { normalizeUrl, toChannelName } from "../features/ctf/helpers.js";
import { defineModal } from "../types/Modal.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ctf:create");

/**
 * Handles the CTF modal submission: creates a channel in the current category
 * and posts an informational embed (with an Archive button) as the first
 * (pinned) message.
 */
export default defineModal({
  customId: CTF_MODAL_ID,
  execute: async (interaction) => {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This can only be used inside a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Work out the category to create the channel in. The panel lives in some
    // channel; we use that channel's parent category (if any).
    const originChannel = interaction.channel;
    const category =
      originChannel && "parent" in originChannel ? originChannel.parent : null;

    // Read submitted fields.
    const name = interaction.fields.getTextInputValue(CTF_FIELDS.name).trim();
    const ctftimeRaw = interaction.fields.getTextInputValue(CTF_FIELDS.ctftime);
    const dates = interaction.fields.getTextInputValue(CTF_FIELDS.dates).trim();
    const access = interaction.fields
      .getTextInputValue(CTF_FIELDS.access)
      .trim();
    const description = interaction.fields
      .getTextInputValue(CTF_FIELDS.description)
      .trim();

    const ctftime = normalizeUrl(ctftimeRaw);

    // Make sure the bot can actually create channels here.
    const me = interaction.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content:
          "I need the **Manage Channels** permission to create CTF channels.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Channel creation may take a moment; defer an ephemeral ack first.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const channel = await interaction.guild.channels.create({
        name: toChannelName(name),
        type: ChannelType.GuildText,
        parent: category?.id,
        topic: [name, ctftime].filter(Boolean).join(" • ").slice(0, 1024),
        reason: `CTF channel created by ${interaction.user.tag} via the CTF panel`,
      });

      // Build the informational embed.
      const embed = new EmbedBuilder()
        .setTitle(`🚩 ${name}`)
        .setColor(0x2ecc71)
        .setTimestamp()
        .setFooter({ text: `Created by ${interaction.user.tag}` });

      if (description) {
        embed.setDescription(description);
      }

      if (ctftime) {
        embed.addFields({
          name: "CTFtime",
          value: `[View event](${ctftime})`,
          inline: true,
        });
      }
      if (dates) {
        embed.addFields({
          name: "🗓️ Dates",
          value: dates.slice(0, 1024),
          inline: true,
        });
      }
      if (access) {
        embed.addFields({
          name: "🔑 Team Access (Creds / Token)",
          value: access.slice(0, 1024),
        });
      }

      // Note if the CTFtime link was dropped for being invalid.
      if (ctftimeRaw.trim() && !ctftime) {
        embed.addFields({
          name: "⚠️ Ignored (not a valid http/https URL)",
          value: "CTFtime link",
        });
      }

      // Archive button — encodes this channel's id so the handler knows what
      // to move. Uses the prefix router, so it survives restarts.
      const row = buildArchiveRow(channel.id);

      const firstMessage = await channel.send({
        embeds: [embed],
        components: [row],
      });
      await firstMessage.pin().catch(() => undefined); // pinning is best-effort

      await interaction.editReply({
        content: `✅ Created ${channel} for **${name}**.`,
      });
    } catch (error) {
      log.error("Failed to create channel:", error);
      await interaction.editReply({
        content:
          "Something went wrong while creating the CTF channel. Please try again.",
      });
    }
  },
});

import { ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js";
import { buildUnarchiveRow } from "../features/ctf/components.js";
import {
  CTF_ARCHIVE_CATEGORY_ID,
  CTF_ARCHIVE_PREFIX,
} from "../features/ctf/constants.js";
import { defineButton } from "../types/Button.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ctf:archive");

/**
 * Prefix-match button ("ctf:archive:<channelId>") that moves the CTF channel
 * into the configured archive category.
 */
export default defineButton({
  prefix: CTF_ARCHIVE_PREFIX,
  execute: async (interaction) => {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This can only be used inside a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Only members who can manage channels may archive.
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.reply({
        content:
          "You need the **Manage Channels** permission to archive this CTF.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // The bot needs the permission too.
    const me = interaction.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content:
          "I need the **Manage Channels** permission to archive channels.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelId = interaction.customId.slice(CTF_ARCHIVE_PREFIX.length);
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content:
          "I couldn't find the CTF channel to archive (it may have been deleted).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Verify the archive category exists and is actually a category.
    const archiveCategory = interaction.guild.channels.cache.get(
      CTF_ARCHIVE_CATEGORY_ID,
    );
    if (
      !archiveCategory ||
      archiveCategory.type !== ChannelType.GuildCategory
    ) {
      await interaction.reply({
        content: `The archive category (\`${CTF_ARCHIVE_CATEGORY_ID}\`) doesn't exist in this server.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Already archived?
    if (channel.parentId === CTF_ARCHIVE_CATEGORY_ID) {
      await interaction.reply({
        content: "This CTF is already archived.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await channel.setParent(CTF_ARCHIVE_CATEGORY_ID, {
        lockPermissions: false,
        reason: `CTF archived by ${interaction.user.tag}`,
      });

      // Lock the channel: deny @everyone the ability to send messages, add
      // reactions, create threads, or send in threads — making it read-only.
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          AddReactions: false,
        },
        { reason: `CTF locked on archive by ${interaction.user.tag}` },
      );

      // Swap the Archive button for an Unarchive button on the original
      // message, so the CTF can be restored later.
      await interaction.message
        .edit({ components: [buildUnarchiveRow(channel.id)] })
        .catch(() => undefined);

      await interaction.editReply({
        content: `📦 Archived and 🔒 locked ${channel} in **${archiveCategory.name}** (now read-only).`,
      });
    } catch (error) {
      log.error("Failed to archive channel:", error);
      await interaction.editReply({
        content:
          "Something went wrong while archiving the channel. Please try again.",
      });
    }
  },
});

import { ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js";
import { buildArchiveRow } from "../features/ctf/components.js";
import {
  CTF_ARCHIVE_CATEGORY_ID,
  CTF_UNARCHIVE_PREFIX,
} from "../features/ctf/constants.js";
import { defineButton } from "../types/Button.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ctf:unarchive");

/**
 * Prefix-match button ("ctf:unarchive:<channelId>") that reverses an archive:
 * moves the channel out of the archive category and unlocks it (restores the
 * @everyone send/react/thread permissions that archiving denied).
 *
 * Note: because the bot is stateless, we don't know the channel's original
 * category, so it's moved to no category (top level). Move it manually if you
 * want it back under a specific category.
 */
export default defineButton({
  prefix: CTF_UNARCHIVE_PREFIX,
  execute: async (interaction) => {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This can only be used inside a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Only members who can manage channels may unarchive.
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.reply({
        content:
          "You need the **Manage Channels** permission to unarchive this CTF.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // The bot needs the permission too.
    const me = interaction.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content:
          "I need the **Manage Channels** permission to unarchive channels.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channelId = interaction.customId.slice(CTF_UNARCHIVE_PREFIX.length);
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content:
          "I couldn't find the CTF channel to unarchive (it may have been deleted).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Not archived?
    if (channel.parentId !== CTF_ARCHIVE_CATEGORY_ID) {
      await interaction.reply({
        content: "This CTF isn't archived.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Move the channel out of the archive category (to top level).
      await channel.setParent(null, {
        lockPermissions: false,
        reason: `CTF unarchived by ${interaction.user.tag}`,
      });

      // Unlock: reset the @everyone overwrites that archiving added, restoring
      // the permissions to inherit from the (now absent) category / server.
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: null,
          SendMessagesInThreads: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null,
          AddReactions: null,
        },
        { reason: `CTF unlocked on unarchive by ${interaction.user.tag}` },
      );

      // Swap the Unarchive button back to an Archive button.
      await interaction.message
        .edit({ components: [buildArchiveRow(channel.id)] })
        .catch(() => undefined);

      await interaction.editReply({
        content: `🔓 Unarchived and unlocked ${channel} (moved out of the archive; now writable again).`,
      });
    } catch (error) {
      log.error("Failed to unarchive channel:", error);
      await interaction.editReply({
        content:
          "Something went wrong while unarchiving the channel. Please try again.",
      });
    }
  },
});

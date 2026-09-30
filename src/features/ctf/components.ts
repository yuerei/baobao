import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { CTF_ARCHIVE_PREFIX, CTF_UNARCHIVE_PREFIX } from "./constants.js";

/**
 * The action row shown on an ACTIVE CTF's embed: an "Archive CTF" button.
 * The channel id is encoded in the customId so the handler survives restarts.
 */
export function buildArchiveRow(
  channelId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${CTF_ARCHIVE_PREFIX}${channelId}`)
      .setLabel("Archive CTF")
      .setEmoji("📦")
      .setStyle(ButtonStyle.Secondary),
  );
}

/**
 * The action row shown on an ARCHIVED CTF's embed: an "Unarchive CTF" button.
 */
export function buildUnarchiveRow(
  channelId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${CTF_UNARCHIVE_PREFIX}${channelId}`)
      .setLabel("Unarchive CTF")
      .setEmoji("🔓")
      .setStyle(ButtonStyle.Success),
  );
}

import {
  Events,
  MessageFlags,
  type AnySelectMenuInteraction,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import { defineEvent } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";
import { isOwner } from "../utils/owners.js";

const log = createLogger("interaction");

type RepliableInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction
  | AnySelectMenuInteraction;

/** Reply with an ephemeral error, whether or not the interaction was already answered. */
async function replyWithError(
  interaction: RepliableInteraction,
  content: string,
): Promise<void> {
  const payload = { content, flags: MessageFlags.Ephemeral } as const;
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => undefined);
  } else {
    await interaction.reply(payload).catch(() => undefined);
  }
}

/** Handle a chat-input (slash) command interaction. */
async function handleCommand(
  client: BaoBaoClient,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    log.warn(`Received unknown command: /${interaction.commandName}`);
    return;
  }

  // Owner-only gate (authorization) — checked before the cooldown so a blocked
  // user isn't charged a cooldown.
  if (command.ownerOnly && !isOwner(interaction.user.id)) {
    await replyWithError(
      interaction,
      "This command is restricted to the bot owner(s).",
    );
    return;
  }

  // Per-user cooldown (rate limit).
  if (command.cooldown && command.cooldown > 0) {
    const remaining = client.cooldowns.check(
      interaction.commandName,
      interaction.user.id,
      command.cooldown,
    );
    if (remaining !== null) {
      await replyWithError(
        interaction,
        `⏳ Please wait **${remaining}s** before using \`/${interaction.commandName}\` again.`,
      );
      return;
    }
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    log.error(`Command /${interaction.commandName} failed:`, error);
    // Don't penalize the user with a cooldown for a command that errored.
    client.cooldowns.clear(interaction.commandName, interaction.user.id);
    await replyWithError(
      interaction,
      "There was an error while executing this command.",
    );
  }
}

/** Handle a button interaction by resolving its handler via customId/prefix. */
async function handleButton(
  client: BaoBaoClient,
  interaction: ButtonInteraction,
): Promise<void> {
  const button = client.resolveButton(interaction.customId);
  if (!button) {
    log.warn(`Received unhandled button: ${interaction.customId}`);
    return;
  }

  try {
    await button.execute(interaction);
  } catch (error) {
    log.error(`Button "${interaction.customId}" failed:`, error);
    await replyWithError(
      interaction,
      "There was an error while handling this button.",
    );
  }
}

/** Handle a modal submit by resolving its handler via customId/prefix. */
async function handleModal(
  client: BaoBaoClient,
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const modal = client.resolveModal(interaction.customId);
  if (!modal) {
    log.warn(`Received unhandled modal submit: ${interaction.customId}`);
    return;
  }

  try {
    await modal.execute(interaction);
  } catch (error) {
    log.error(`Modal "${interaction.customId}" failed:`, error);
    await replyWithError(
      interaction,
      "There was an error while processing this form.",
    );
  }
}

/** Handle a select-menu interaction by resolving its handler via customId/prefix. */
async function handleSelectMenu(
  client: BaoBaoClient,
  interaction: AnySelectMenuInteraction,
): Promise<void> {
  const menu = client.resolveSelectMenu(interaction.customId);
  if (!menu) {
    log.warn(`Received unhandled select menu: ${interaction.customId}`);
    return;
  }

  try {
    await menu.execute(interaction);
  } catch (error) {
    log.error(`Select menu "${interaction.customId}" failed:`, error);
    await replyWithError(
      interaction,
      "There was an error while handling this menu.",
    );
  }
}

/** Handle an autocomplete request by delegating to the command's handler. */
async function handleAutocomplete(
  client: BaoBaoClient,
  interaction: AutocompleteInteraction,
): Promise<void> {
  const command = client.commands.get(interaction.commandName);
  if (!command?.autocomplete) return;

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    log.error(`Autocomplete for /${interaction.commandName} failed:`, error);
    // Best-effort empty response so the client doesn't hang.
    if (!interaction.responded) {
      await interaction.respond([]).catch(() => undefined);
    }
  }
}

/**
 * Central interaction router: dispatches slash commands, autocomplete requests,
 * button clicks, select-menu selections, and modal submissions to their
 * respective handlers.
 */
export default defineEvent({
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    const client = interaction.client as BaoBaoClient;

    if (interaction.isChatInputCommand()) {
      await handleCommand(client, interaction);
    } else if (interaction.isAutocomplete()) {
      await handleAutocomplete(client, interaction);
    } else if (interaction.isButton()) {
      await handleButton(client, interaction);
    } else if (interaction.isAnySelectMenu()) {
      await handleSelectMenu(client, interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(client, interaction);
    }
  },
});

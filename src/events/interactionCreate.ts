import {
  Events,
  MessageFlags,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import { defineEvent } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("interaction");

type RepliableInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

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

  try {
    await command.execute(interaction);
  } catch (error) {
    log.error(`Command /${interaction.commandName} failed:`, error);
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

/**
 * Central interaction router: dispatches slash commands, button clicks, and
 * modal submissions to their respective handlers.
 */
export default defineEvent({
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    const client = interaction.client as BaoBaoClient;

    if (interaction.isChatInputCommand()) {
      await handleCommand(client, interaction);
    } else if (interaction.isButton()) {
      await handleButton(client, interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(client, interaction);
    }
  },
});

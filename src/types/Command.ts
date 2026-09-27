import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

/**
 * Any of the slash-command builder shapes discord.js can produce.
 * All of them expose `.toJSON()` for registration.
 */
export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

/**
 * A slash command: its definition (`data`) and the handler (`execute`)
 * invoked when a user runs it.
 */
export interface Command {
  /** The slash command definition, built with SlashCommandBuilder. */
  data: SlashCommandData;
  /**
   * Optional grouping label used by `/help` to organize commands.
   * Defaults to "General" when omitted.
   */
  category?: string;
  /** The handler invoked when the command is used. */
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
  /**
   * Optional autocomplete handler, invoked when a user is typing an option
   * marked with `.setAutocomplete(true)`. Respond via `interaction.respond()`.
   */
  autocomplete?: (interaction: AutocompleteInteraction) => void | Promise<void>;
}

/**
 * Helper to define a command with proper typing.
 */
export function defineCommand(command: Command): Command {
  return command;
}

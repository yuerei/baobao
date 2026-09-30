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
  /**
   * Optional per-user cooldown in seconds. After a user runs the command, they
   * must wait this long before running it again. Omit or set to 0 for none.
   */
  cooldown?: number;
  /**
   * When true, only users whose id is in the OWNER_IDS env var may run the
   * command. Others get an ephemeral refusal.
   */
  ownerOnly?: boolean;
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

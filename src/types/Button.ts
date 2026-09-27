import type { ButtonInteraction } from "discord.js";

/**
 * A button interaction handler.
 *
 * Matching against an incoming interaction's `customId` works one of two ways:
 * - `customId` (string): exact match. e.g. `"confirm"` handles exactly `confirm`.
 * - `prefix` (string): matches any customId starting with it, allowing you to
 *   encode data after a separator. e.g. prefix `"vote:"` handles `vote:42`,
 *   and the full customId is available on `interaction.customId`.
 *
 * Provide exactly one of `customId` or `prefix`.
 */
export type Button =
  | {
      customId: string;
      prefix?: never;
      execute: (interaction: ButtonInteraction) => void | Promise<void>;
    }
  | {
      customId?: never;
      prefix: string;
      execute: (interaction: ButtonInteraction) => void | Promise<void>;
    };

/**
 * Helper to define a button handler with proper typing.
 */
export function defineButton(button: Button): Button {
  return button;
}

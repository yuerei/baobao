import type { ModalSubmitInteraction } from "discord.js";

/**
 * A modal submit interaction handler.
 *
 * Matching against an incoming interaction's `customId` works one of two ways:
 * - `customId` (string): exact match. e.g. `"feedback"` handles exactly `feedback`.
 * - `prefix` (string): matches any customId starting with it, allowing you to
 *   encode data after a separator. e.g. prefix `"edit:"` handles `edit:42`,
 *   and the full customId is available on `interaction.customId`.
 *
 * Provide exactly one of `customId` or `prefix`.
 */
export type Modal =
  | {
      customId: string;
      prefix?: never;
      execute: (interaction: ModalSubmitInteraction) => void | Promise<void>;
    }
  | {
      customId?: never;
      prefix: string;
      execute: (interaction: ModalSubmitInteraction) => void | Promise<void>;
    };

/**
 * Helper to define a modal handler with proper typing.
 */
export function defineModal(modal: Modal): Modal {
  return modal;
}

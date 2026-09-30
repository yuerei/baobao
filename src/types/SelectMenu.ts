import type { AnySelectMenuInteraction } from "discord.js";

/**
 * A select-menu interaction handler. Covers all select types (string, user,
 * role, channel, mentionable) via `AnySelectMenuInteraction`. If you need a
 * specific type, narrow inside `execute` (e.g. `interaction.isStringSelectMenu()`).
 *
 * Matching against an incoming interaction's `customId` works one of two ways:
 * - `customId` (string): exact match. e.g. `"role-picker"`.
 * - `prefix` (string): matches any customId starting with it, so you can encode
 *   data after a separator. e.g. prefix `"assign:"` handles `assign:mods`, and
 *   the full customId is available on `interaction.customId`.
 *
 * Provide exactly one of `customId` or `prefix`.
 */
export type SelectMenu =
  | {
      customId: string;
      prefix?: never;
      execute: (interaction: AnySelectMenuInteraction) => void | Promise<void>;
    }
  | {
      customId?: never;
      prefix: string;
      execute: (interaction: AnySelectMenuInteraction) => void | Promise<void>;
    };

/**
 * Helper to define a select-menu handler with proper typing.
 */
export function defineSelectMenu(menu: SelectMenu): SelectMenu {
  return menu;
}

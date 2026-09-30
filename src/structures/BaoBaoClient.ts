import { Client, Collection, type ClientOptions } from "discord.js";
import type { Button } from "../types/Button.js";
import type { Command } from "../types/Command.js";
import type { Modal } from "../types/Modal.js";
import type { SelectMenu } from "../types/SelectMenu.js";
import { CooldownManager } from "../utils/cooldowns.js";

/**
 * Resolve a handler for a customId, trying an exact match first, then the
 * longest matching prefix. Shared by buttons and modals.
 */
function resolveByCustomId<T>(
  customId: string,
  exact: Collection<string, T>,
  prefixes: Collection<string, T>,
): T | undefined {
  const direct = exact.get(customId);
  if (direct) return direct;

  let match: T | undefined;
  let matchedPrefixLength = -1;
  for (const [prefix, handler] of prefixes) {
    if (customId.startsWith(prefix) && prefix.length > matchedPrefixLength) {
      match = handler;
      matchedPrefixLength = prefix.length;
    }
  }
  return match;
}

/**
 * A Client subclass that carries strongly-typed collections of the bot's
 * interactive pieces.
 */
export class BaoBaoClient extends Client {
  /** All loaded slash commands, keyed by their name. */
  public readonly commands = new Collection<string, Command>();

  /** Button handlers with an exact-match customId, keyed by that customId. */
  public readonly buttons = new Collection<string, Button>();

  /** Button handlers matched by a customId prefix, keyed by that prefix. */
  public readonly buttonPrefixes = new Collection<string, Button>();

  /** Modal handlers with an exact-match customId, keyed by that customId. */
  public readonly modals = new Collection<string, Modal>();

  /** Modal handlers matched by a customId prefix, keyed by that prefix. */
  public readonly modalPrefixes = new Collection<string, Modal>();

  /** Select-menu handlers with an exact-match customId, keyed by that customId. */
  public readonly selectMenus = new Collection<string, SelectMenu>();

  /** Select-menu handlers matched by a customId prefix, keyed by that prefix. */
  public readonly selectMenuPrefixes = new Collection<string, SelectMenu>();

  /** Tracks per-user command cooldowns. */
  public readonly cooldowns = new CooldownManager();

  constructor(options: ClientOptions) {
    super(options);
  }

  /**
   * Resolve the button handler for a given customId, trying an exact match
   * first, then the longest matching prefix.
   */
  public resolveButton(customId: string): Button | undefined {
    return resolveByCustomId(customId, this.buttons, this.buttonPrefixes);
  }

  /**
   * Resolve the modal handler for a given customId, trying an exact match
   * first, then the longest matching prefix.
   */
  public resolveModal(customId: string): Modal | undefined {
    return resolveByCustomId(customId, this.modals, this.modalPrefixes);
  }

  /**
   * Resolve the select-menu handler for a given customId, trying an exact
   * match first, then the longest matching prefix.
   */
  public resolveSelectMenu(customId: string): SelectMenu | undefined {
    return resolveByCustomId(
      customId,
      this.selectMenus,
      this.selectMenuPrefixes,
    );
  }
}

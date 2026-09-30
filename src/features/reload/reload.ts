import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import { loadButtons } from "../../loaders/loadButtons.js";
import { loadCommands } from "../../loaders/loadCommands.js";
import { loadModals } from "../../loaders/loadModals.js";
import { loadSelectMenus } from "../../loaders/loadSelectMenus.js";
import { DIRS } from "../../utils/paths.js";

/** What can be reloaded. */
export type ReloadTarget = "commands" | "buttons" | "selectMenus" | "modals";

export interface ReloadResult {
  target: ReloadTarget;
  count: number;
}

/**
 * Reload one category of handlers: clear its collection(s), then re-import the
 * modules with cache-busting so file changes are picked up.
 *
 * Note: events are intentionally NOT reloadable here — re-registering listeners
 * would duplicate them. Restart the bot to change events.
 */
export async function reloadTarget(
  client: BaoBaoClient,
  target: ReloadTarget,
): Promise<ReloadResult> {
  switch (target) {
    case "commands": {
      client.commands.clear();
      const count = await loadCommands(client, DIRS.commands, true);
      return { target, count };
    }
    case "buttons": {
      client.buttons.clear();
      client.buttonPrefixes.clear();
      const count = await loadButtons(client, DIRS.buttons, true);
      return { target, count };
    }
    case "selectMenus": {
      client.selectMenus.clear();
      client.selectMenuPrefixes.clear();
      const count = await loadSelectMenus(client, DIRS.selectMenus, true);
      return { target, count };
    }
    case "modals": {
      client.modals.clear();
      client.modalPrefixes.clear();
      const count = await loadModals(client, DIRS.modals, true);
      return { target, count };
    }
  }
}

/** Reload every reloadable category. */
export async function reloadAll(client: BaoBaoClient): Promise<ReloadResult[]> {
  const targets: ReloadTarget[] = [
    "commands",
    "buttons",
    "selectMenus",
    "modals",
  ];
  const results: ReloadResult[] = [];
  for (const target of targets) {
    results.push(await reloadTarget(client, target));
  }
  return results;
}

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import type { SelectMenu } from "../types/SelectMenu.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("loader:selects");

/** Recursively collect .js/.ts module files under a directory. */
function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

/** Type guard for a valid SelectMenu module. */
function isSelectMenu(value: unknown): value is SelectMenu {
  const menu = value as Partial<SelectMenu> | undefined;
  if (!menu || typeof menu !== "object" || typeof menu.execute !== "function") {
    return false;
  }
  const hasCustomId =
    typeof menu.customId === "string" && menu.customId.length > 0;
  const hasPrefix = typeof menu.prefix === "string" && menu.prefix.length > 0;
  // Exactly one of customId / prefix.
  return hasCustomId !== hasPrefix;
}

/**
 * Load every select-menu handler in the `selectMenus/` directory (including
 * subfolders) into the client's select-menu collections.
 *
 * @returns the number of select-menu handlers loaded.
 */
export async function loadSelectMenus(
  client: BaoBaoClient,
  selectMenusDir: string,
  bustCache = false,
): Promise<number> {
  const files = collectFiles(selectMenusDir);
  let loaded = 0;

  for (const filePath of files) {
    const url =
      pathToFileURL(filePath).href + (bustCache ? `?v=${Date.now()}` : "");
    const imported = await import(url);
    const menu: unknown = imported.default;

    if (!isSelectMenu(menu)) {
      log.warn(
        `Skipping ${filePath}: not a valid select-menu module (needs execute and exactly one of customId/prefix).`,
      );
      continue;
    }

    if (menu.customId) {
      if (client.selectMenus.has(menu.customId)) {
        log.warn(
          `Duplicate select-menu customId "${menu.customId}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.selectMenus.set(menu.customId, menu);
      log.info(`Registered select menu (exact): ${menu.customId}`);
    } else {
      const prefix = menu.prefix!;
      if (client.selectMenuPrefixes.has(prefix)) {
        log.warn(
          `Duplicate select-menu prefix "${prefix}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.selectMenuPrefixes.set(prefix, menu);
      log.info(`Registered select menu (prefix): ${prefix}*`);
    }

    loaded++;
  }

  return loaded;
}

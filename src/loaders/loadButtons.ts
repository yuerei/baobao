import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import type { Button } from "../types/Button.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("loader:buttons");

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

/** Type guard for a valid Button module. */
function isButton(value: unknown): value is Button {
  const btn = value as Partial<Button> | undefined;
  if (!btn || typeof btn !== "object" || typeof btn.execute !== "function") {
    return false;
  }
  const hasCustomId =
    typeof btn.customId === "string" && btn.customId.length > 0;
  const hasPrefix = typeof btn.prefix === "string" && btn.prefix.length > 0;
  // Exactly one of customId / prefix.
  return hasCustomId !== hasPrefix;
}

/**
 * Load every button handler in the `buttons/` directory (including subfolders)
 * into the client's button collections.
 *
 * @returns the number of button handlers loaded.
 */
export async function loadButtons(
  client: BaoBaoClient,
  buttonsDir: string,
  bustCache = false,
): Promise<number> {
  const files = collectFiles(buttonsDir);
  let loaded = 0;

  for (const filePath of files) {
    const url =
      pathToFileURL(filePath).href + (bustCache ? `?v=${Date.now()}` : "");
    const imported = await import(url);
    const button: unknown = imported.default;

    if (!isButton(button)) {
      log.warn(
        `Skipping ${filePath}: not a valid button module (needs execute and exactly one of customId/prefix).`,
      );
      continue;
    }

    if (button.customId) {
      if (client.buttons.has(button.customId)) {
        log.warn(
          `Duplicate button customId "${button.customId}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.buttons.set(button.customId, button);
      log.info(`Registered button (exact): ${button.customId}`);
    } else {
      const prefix = button.prefix!;
      if (client.buttonPrefixes.has(prefix)) {
        log.warn(
          `Duplicate button prefix "${prefix}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.buttonPrefixes.set(prefix, button);
      log.info(`Registered button (prefix): ${prefix}*`);
    }

    loaded++;
  }

  return loaded;
}

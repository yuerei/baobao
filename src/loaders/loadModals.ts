import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import type { Modal } from "../types/Modal.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("loader:modals");

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

/** Type guard for a valid Modal module. */
function isModal(value: unknown): value is Modal {
  const modal = value as Partial<Modal> | undefined;
  if (
    !modal ||
    typeof modal !== "object" ||
    typeof modal.execute !== "function"
  ) {
    return false;
  }
  const hasCustomId =
    typeof modal.customId === "string" && modal.customId.length > 0;
  const hasPrefix = typeof modal.prefix === "string" && modal.prefix.length > 0;
  // Exactly one of customId / prefix.
  return hasCustomId !== hasPrefix;
}

/**
 * Load every modal handler in the `modals/` directory (including subfolders)
 * into the client's modal collections.
 *
 * @returns the number of modal handlers loaded.
 */
export async function loadModals(
  client: BaoBaoClient,
  modalsDir: string,
): Promise<number> {
  const files = collectFiles(modalsDir);
  let loaded = 0;

  for (const filePath of files) {
    const imported = await import(pathToFileURL(filePath).href);
    const modal: unknown = imported.default;

    if (!isModal(modal)) {
      log.warn(
        `Skipping ${filePath}: not a valid modal module (needs execute and exactly one of customId/prefix).`,
      );
      continue;
    }

    if (modal.customId) {
      if (client.modals.has(modal.customId)) {
        log.warn(
          `Duplicate modal customId "${modal.customId}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.modals.set(modal.customId, modal);
      log.info(`Registered modal (exact): ${modal.customId}`);
    } else {
      const prefix = modal.prefix!;
      if (client.modalPrefixes.has(prefix)) {
        log.warn(
          `Duplicate modal prefix "${prefix}" in ${filePath}; keeping the first.`,
        );
        continue;
      }
      client.modalPrefixes.set(prefix, modal);
      log.info(`Registered modal (prefix): ${prefix}*`);
    }

    loaded++;
  }

  return loaded;
}

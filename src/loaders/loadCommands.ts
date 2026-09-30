import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import type { Command } from "../types/Command.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("loader:commands");

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

/** Type guard for a valid Command module. */
function isCommand(value: unknown): value is Command {
  const cmd = value as Partial<Command> | undefined;
  return (
    !!cmd &&
    typeof cmd === "object" &&
    "data" in cmd &&
    !!cmd.data &&
    typeof cmd.execute === "function"
  );
}

/**
 * Load every command in the `commands/` directory (including subfolders,
 * which act as categories) into `client.commands`.
 *
 * @returns the number of commands loaded.
 */
export async function loadCommands(
  client: BaoBaoClient,
  commandsDir: string,
  bustCache = false,
): Promise<number> {
  const files = collectFiles(commandsDir);
  let loaded = 0;

  for (const filePath of files) {
    // ESM caches imports by URL; a query string forces a fresh module on reload.
    const url =
      pathToFileURL(filePath).href + (bustCache ? `?v=${Date.now()}` : "");
    const imported = await import(url);
    const command: unknown = imported.default;

    if (!isCommand(command)) {
      log.warn(`Skipping ${filePath}: not a valid command module.`);
      continue;
    }

    const name = command.data.name;
    if (client.commands.has(name)) {
      log.warn(
        `Duplicate command name "${name}" in ${filePath}; keeping the first.`,
      );
      continue;
    }

    client.commands.set(name, command);
    loaded++;
    log.info(`Registered command: /${name}`);
  }

  return loaded;
}

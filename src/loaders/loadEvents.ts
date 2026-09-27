import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BaoBaoClient } from "../structures/BaoBaoClient.js";
import type { Event } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("loader:events");

/** Type guard for a valid Event module. */
function isEvent(value: unknown): value is Event {
  const event = value as Partial<Event> | undefined;
  return (
    !!event &&
    typeof event === "object" &&
    !!event.name &&
    typeof event.execute === "function"
  );
}

/**
 * Dynamically load every event module in the `events/` directory and
 * register it on the client.
 *
 * @returns the number of events loaded.
 */
export async function loadEvents(
  client: BaoBaoClient,
  eventsDir: string,
): Promise<number> {
  const files = readdirSync(eventsDir).filter(
    (file) => file.endsWith(".js") || file.endsWith(".ts"),
  );
  let loaded = 0;

  for (const file of files) {
    const filePath = join(eventsDir, file);
    const imported = await import(pathToFileURL(filePath).href);
    const event: unknown = imported.default;

    if (!isEvent(event)) {
      log.warn(`Skipping ${file}: not a valid event module.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    loaded++;
    log.info(`Registered event: ${event.name} (once: ${event.once ?? false})`);
  }

  return loaded;
}

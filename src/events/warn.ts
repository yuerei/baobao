import { Events } from "discord.js";
import { defineEvent } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("client");

/**
 * The client `warn` event fires on non-fatal issues discord.js wants to
 * surface (e.g. rate-limit warnings, deprecations).
 */
export default defineEvent({
  name: Events.Warn,
  execute: (message) => {
    log.warn(message);
  },
});

import { Events } from "discord.js";
import { defineEvent } from "../types/Event.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("client");

/**
 * The client `error` event fires on websocket/connection errors. Logging it
 * (rather than letting it surface as an unhandled error) keeps the bot alive.
 */
export default defineEvent({
  name: Events.Error,
  execute: (error) => {
    log.error("Client error:", error);
  },
});

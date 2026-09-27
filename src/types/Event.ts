import type { ClientEvents } from "discord.js";

/**
 * A typed Discord.js event handler.
 *
 * `K` is constrained to the keys of `ClientEvents`, so `execute`'s arguments
 * are automatically inferred for the specific event you're handling.
 */
export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  /** The name of the event to listen for (e.g. "ready", "messageCreate"). */
  name: K;
  /** Whether the listener should fire only once. */
  once?: boolean;
  /** The handler invoked when the event is emitted. */
  execute: (...args: ClientEvents[K]) => void | Promise<void>;
}

/**
 * Helper to define an event with full type inference on `execute`.
 */
export function defineEvent<K extends keyof ClientEvents>(
  event: Event<K>,
): Event<K> {
  return event;
}

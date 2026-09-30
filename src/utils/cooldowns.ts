import { Collection } from "discord.js";

/**
 * Tracks per-user, per-command cooldowns in memory.
 *
 * Structure: commandName -> (userId -> expiry timestamp in ms).
 *
 * Note: state is in-memory, so cooldowns reset when the bot restarts. That's
 * acceptable for rate-limiting; persistence would only matter for very long
 * cooldowns across restarts.
 */
export class CooldownManager {
  private readonly buckets = new Collection<
    string,
    Collection<string, number>
  >();

  /**
   * Check the cooldown for a user on a command.
   *
   * @returns the remaining seconds if the user is still on cooldown, or `null`
   *          if they're free to run it (which also starts a new cooldown).
   */
  public check(
    commandName: string,
    userId: string,
    cooldownSeconds: number,
  ): number | null {
    if (!cooldownSeconds || cooldownSeconds <= 0) return null;

    const now = Date.now();
    const bucket =
      this.buckets.get(commandName) ?? new Collection<string, number>();

    const expiresAt = bucket.get(userId);
    if (expiresAt !== undefined && now < expiresAt) {
      // Still cooling down — report remaining time, rounded up.
      return Math.ceil((expiresAt - now) / 1000);
    }

    // Free to run: record a fresh expiry and allow.
    bucket.set(userId, now + cooldownSeconds * 1000);
    this.buckets.set(commandName, bucket);
    return null;
  }

  /** Clear a specific user's cooldown for a command (e.g. after a failed run). */
  public clear(commandName: string, userId: string): void {
    this.buckets.get(commandName)?.delete(userId);
  }
}

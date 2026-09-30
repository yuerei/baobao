/**
 * Parse the OWNER_IDS env var into a set of user ids.
 * Accepts comma- and/or whitespace-separated ids, e.g. "123, 456 789".
 */
export function getOwnerIds(): Set<string> {
  const raw = process.env.OWNER_IDS ?? "";
  const ids = raw
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return new Set(ids);
}

/** Whether the given user id is configured as a bot owner. */
export function isOwner(userId: string): boolean {
  return getOwnerIds().has(userId);
}

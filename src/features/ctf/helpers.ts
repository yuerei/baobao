/**
 * Convert an arbitrary CTF name into a valid Discord text-channel name:
 * lowercase, spaces/invalid chars → hyphens, collapsed and trimmed, and
 * capped at Discord's 100-character limit. Falls back to "ctf" if empty.
 */
export function toChannelName(raw: string): string {
  const slug = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/-+/g, "-") // collapse repeats
    .replace(/^-|-$/g, "") // trim leading/trailing hyphens
    .slice(0, 100);

  return slug || "ctf";
}

/**
 * Validate that a string looks like an http(s) URL. Returns the trimmed URL
 * if valid, otherwise `null`.
 */
export function normalizeUrl(raw: string | undefined | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

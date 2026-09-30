import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the compiled/source `src` (or `dist`) root — the directory
 * that contains BaoBao, loaders/, commands/, etc. Resolved relative to this
 * file, which lives in `<root>/utils/`.
 */
export const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Directories the loaders read from. */
export const DIRS = {
  commands: join(SRC_ROOT, "commands"),
  buttons: join(SRC_ROOT, "buttons"),
  selectMenus: join(SRC_ROOT, "selectMenus"),
  modals: join(SRC_ROOT, "modals"),
  events: join(SRC_ROOT, "events"),
} as const;

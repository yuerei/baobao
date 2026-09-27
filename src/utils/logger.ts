/**
 * A tiny, dependency-free leveled logger.
 *
 * Output format: `2026-09-27T12:00:00.000Z [LEVEL] (scope) message`
 *
 * The minimum level can be set with the `LOG_LEVEL` env var
 * (debug | info | warn | error). Defaults to `info`.
 */

const LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LEVELS)[number];

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  return (LEVELS as readonly string[]).includes(raw ?? "")
    ? (raw as LogLevel)
    : "info";
}

const minLevel = resolveMinLevel();

/** ANSI colors for terminals; skipped when not a TTY. */
const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

export class Logger {
  constructor(private readonly scope: string) {}

  private write(level: LogLevel, message: unknown, ...rest: unknown[]): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return;

    const timestamp = new Date().toISOString();
    const label = level.toUpperCase().padEnd(5);
    const useColor = process.stdout.isTTY;
    const coloredLabel = useColor ? `${COLORS[level]}${label}${RESET}` : label;
    const prefix = `${timestamp} [${coloredLabel}] (${this.scope})`;

    const sink =
      level === "error" || level === "warn" ? console.error : console.log;
    sink(prefix, message, ...rest);
  }

  debug(message: unknown, ...rest: unknown[]): void {
    this.write("debug", message, ...rest);
  }

  info(message: unknown, ...rest: unknown[]): void {
    this.write("info", message, ...rest);
  }

  warn(message: unknown, ...rest: unknown[]): void {
    this.write("warn", message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    this.write("error", message, ...rest);
  }

  /** Create a child logger with a nested scope. */
  child(subScope: string): Logger {
    return new Logger(`${this.scope}:${subScope}`);
  }
}

/** A default root logger. */
export const logger = new Logger("bot");

/** Convenience factory for scoped loggers. */
export function createLogger(scope: string): Logger {
  return new Logger(scope);
}

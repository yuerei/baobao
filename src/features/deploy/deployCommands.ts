import {
  REST,
  Routes,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("deploy");

export interface DeployOptions {
  token: string;
  clientId: string;
  /** If provided, commands register to this guild (instant). Otherwise global. */
  guildId?: string;
}

/**
 * Register the client's loaded slash commands with Discord's API.
 * Commands must already be loaded into `client.commands`.
 *
 * @returns the number of commands deployed.
 */
export async function deployCommands(
  client: BaoBaoClient,
  { token, clientId, guildId }: DeployOptions,
): Promise<number> {
  const body: RESTPostAPIApplicationCommandsJSONBody[] = client.commands.map(
    (command) => command.data.toJSON(),
  );

  const rest = new REST().setToken(token);

  if (guildId) {
    log.info(`Registering ${body.length} command(s) to guild ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body,
    });
    log.info("Guild commands registered (available immediately).");
  } else {
    log.info(`Registering ${body.length} command(s) globally...`);
    await rest.put(Routes.applicationCommands(clientId), { body });
    log.info(
      "Global commands registered (may take up to 1 hour to propagate).",
    );
  }

  return body.length;
}

export interface ClearOptions {
  token: string;
  clientId: string;
  /** If provided, clears that guild's commands. Otherwise clears global commands. */
  guildId?: string;
}

/**
 * Remove all registered slash commands by overwriting the command list with
 * an empty array.
 *
 * - Without `guildId`: clears GLOBAL commands (can take up to ~1 hour to
 *   disappear from clients).
 * - With `guildId`: clears that guild's commands (effective immediately).
 */
export async function clearCommands({
  token,
  clientId,
  guildId,
}: ClearOptions): Promise<void> {
  const rest = new REST().setToken(token);

  if (guildId) {
    log.info(`Clearing all commands for guild ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: [],
    });
    log.info("Guild commands cleared (effective immediately).");
  } else {
    log.info("Clearing all GLOBAL commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    log.info("Global commands cleared (may take up to 1 hour to propagate).");
  }
}

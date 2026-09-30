import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type APIApplicationCommandOption,
} from "discord.js";
import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import type { Command } from "../../types/Command.js";
import { defineCommand } from "../../types/Command.js";

const DEFAULT_CATEGORY = "General";
const EMBED_COLOR = 0x5865f2;

/** Group loaded commands by their (optional) category. */
function groupByCategory(commands: Iterable<Command>): Map<string, Command[]> {
  const groups = new Map<string, Command[]>();
  for (const command of commands) {
    const category = command.category ?? DEFAULT_CATEGORY;
    const bucket = groups.get(category) ?? [];
    bucket.push(command);
    groups.set(category, bucket);
  }
  // Sort commands within each category by name for stable output.
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => a.data.name.localeCompare(b.data.name));
  }
  return groups;
}

/** Build the overview embed listing every command grouped by category. */
function buildOverview(client: BaoBaoClient): EmbedBuilder {
  const groups = groupByCategory(client.commands.values());
  const embed = new EmbedBuilder()
    .setTitle("📖 Help")
    .setDescription(
      `Here are all ${client.commands.size} available command(s). ` +
        "Use `/help command:<name>` for details on a specific command.",
    )
    .setColor(EMBED_COLOR);

  // Sort categories alphabetically for stable output.
  for (const category of [...groups.keys()].sort((a, b) =>
    a.localeCompare(b),
  )) {
    const list = groups
      .get(category)!
      .map((cmd) => `**/${cmd.data.name}** — ${cmd.data.description}`)
      .join("\n");
    embed.addFields({ name: category, value: list });
  }

  return embed;
}

/** Format a single command option into a readable line. */
function formatOption(option: APIApplicationCommandOption): string {
  const required =
    "required" in option && option.required ? " *(required)*" : "";
  return `\`${option.name}\`${required} — ${option.description}`;
}

/** Build a detailed embed for one command. */
function buildDetail(command: Command): EmbedBuilder {
  const json = command.data.toJSON();
  const embed = new EmbedBuilder()
    .setTitle(`/${json.name}`)
    .setDescription(json.description || "No description provided.")
    .setColor(EMBED_COLOR)
    .addFields({
      name: "Category",
      value: command.category ?? DEFAULT_CATEGORY,
      inline: true,
    });

  if (command.cooldown && command.cooldown > 0) {
    embed.addFields({
      name: "Cooldown",
      value: `${command.cooldown}s`,
      inline: true,
    });
  }
  if (command.ownerOnly) {
    embed.addFields({ name: "Access", value: "Owner only", inline: true });
  }

  const options = (json.options ?? []) as APIApplicationCommandOption[];
  if (options.length > 0) {
    embed.addFields({
      name: "Options",
      value: options.map(formatOption).join("\n"),
    });
  }

  return embed;
}

/**
 * /help — lists all commands, or shows details for a specific command.
 * Content is generated dynamically from the loaded commands, so it stays in
 * sync automatically.
 */
export default defineCommand({
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all commands, or get details on a specific one.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to get detailed help for.")
        .setRequired(false)
        .setAutocomplete(true),
    ),
  execute: async (interaction) => {
    const client = interaction.client as BaoBaoClient;
    const query = interaction.options.getString("command");

    if (!query) {
      await interaction.reply({
        embeds: [buildOverview(client)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const command = client.commands.get(query.toLowerCase().replace(/^\//, ""));
    if (!command) {
      await interaction.reply({
        content: `No command named \`${query}\` was found. Use \`/help\` to see them all.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [buildDetail(command)],
      flags: MessageFlags.Ephemeral,
    });
  },
  autocomplete: async (interaction) => {
    const client = interaction.client as BaoBaoClient;
    const focused = interaction.options.getFocused().toLowerCase();

    const choices = [...client.commands.values()]
      .map((cmd) => cmd.data.name)
      .filter((name) => name.includes(focused))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 25) // Discord allows at most 25 autocomplete choices.
      .map((name) => ({ name: `/${name}`, value: name }));

    await interaction.respond(choices);
  },
});

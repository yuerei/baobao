import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type APIApplicationCommandOption,
} from "discord.js";
import type { BaoBaoClient } from "../../structures/BaoBaoClient.js";
import type { Command } from "../../types/Command.js";
import { defineCommand } from "../../types/Command.js";
import { isOwner } from "../../utils/owners.js";

const DEFAULT_CATEGORY = "General";
const EMBED_COLOR = 0x5865f2;

/** Emoji shown next to known category names in the overview. */
const CATEGORY_EMOJI: Record<string, string> = {
  Utility: "🛠️",
  CTF: "🚩",
  Owner: "👑",
  General: "📦",
};

function categoryLabel(name: string): string {
  const emoji = CATEGORY_EMOJI[name] ?? "📁";
  return `${emoji}  ${name}`;
}

/**
 * Return the commands a given user is allowed to see. Owner-only commands are
 * hidden from everyone except configured owners.
 */
function visibleCommands(client: BaoBaoClient, userId: string): Command[] {
  const owner = isOwner(userId);
  return [...client.commands.values()].filter((cmd) => owner || !cmd.ownerOnly);
}

/** Small badge string for a command's cooldown / owner-only status. */
function badges(command: Command): string {
  const parts: string[] = [];
  if (command.cooldown && command.cooldown > 0)
    parts.push(`⏳ ${command.cooldown}s`);
  if (command.ownerOnly) parts.push("👑");
  return parts.length ? `  ·  ${parts.join(" ")}` : "";
}

/** Group commands by their (optional) category, sorted within each group. */
function groupByCategory(commands: Command[]): Map<string, Command[]> {
  const groups = new Map<string, Command[]>();
  for (const command of commands) {
    const category = command.category ?? DEFAULT_CATEGORY;
    const bucket = groups.get(category) ?? [];
    bucket.push(command);
    groups.set(category, bucket);
  }
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => a.data.name.localeCompare(b.data.name));
  }
  return groups;
}

/** Build the overview embed listing visible commands grouped by category. */
function buildOverview(commands: Command[]): EmbedBuilder {
  const groups = groupByCategory(commands);
  const embed = new EmbedBuilder()
    .setTitle("📖  Command Help")
    .setColor(EMBED_COLOR)
    .setDescription(
      "Browse the commands below, grouped by category.\n" +
        "Use `/help command:<name>` for details on any command.",
    )
    .setFooter({ text: `${commands.length} command(s) available` });

  for (const category of [...groups.keys()].sort((a, b) =>
    a.localeCompare(b),
  )) {
    const list = groups
      .get(category)!
      .map(
        (cmd) =>
          `\`/${cmd.data.name}\`${badges(cmd)}\n╰ ${cmd.data.description}`,
      )
      .join("\n");
    embed.addFields({ name: categoryLabel(category), value: list });
  }

  return embed;
}

/** Human-friendly name for an application command option type. */
function optionTypeName(type: ApplicationCommandOptionType): string {
  return ApplicationCommandOptionType[type] ?? "Option";
}

/** Format a single command option into a readable line. */
function formatOption(option: APIApplicationCommandOption): string {
  const isRequired = "required" in option && option.required;
  const marker = isRequired ? "🔹" : "▫️";
  const req = isRequired ? "required" : "optional";
  return `${marker} \`${option.name}\` — ${option.description}\n╰ *${optionTypeName(option.type)}, ${req}*`;
}

/** Build a "usage" string like `/help <command>` or `/help [command]`. */
function buildUsage(
  name: string,
  options: APIApplicationCommandOption[],
): string {
  const parts = options.map((o) => {
    const required = "required" in o && o.required;
    return required ? `<${o.name}>` : `[${o.name}]`;
  });
  return ["/" + name, ...parts].join(" ");
}

/** Build a detailed embed for one command. */
function buildDetail(command: Command): EmbedBuilder {
  const json = command.data.toJSON();
  const options = (json.options ?? []) as APIApplicationCommandOption[];

  const embed = new EmbedBuilder()
    .setTitle(`/${json.name}`)
    .setDescription(json.description || "No description provided.")
    .setColor(EMBED_COLOR)
    .addFields(
      {
        name: "📁 Category",
        value: command.category ?? DEFAULT_CATEGORY,
        inline: true,
      },
      {
        name: "⏳ Cooldown",
        value:
          command.cooldown && command.cooldown > 0
            ? `${command.cooldown}s`
            : "None",
        inline: true,
      },
      {
        name: "🔒 Access",
        value: command.ownerOnly ? "Owner only" : "Everyone",
        inline: true,
      },
    );

  if (options.length > 0) {
    embed.addFields({
      name: "⚙️ Options",
      value: options.map(formatOption).join("\n"),
    });
  }

  embed.addFields({
    name: "📝 Usage",
    value: `\`${buildUsage(json.name, options)}\``,
  });
  return embed;
}

/**
 * /help — lists all commands, or shows details for a specific command.
 * Content is generated dynamically from the loaded commands, so it stays in
 * sync automatically. Owner-only commands are hidden from non-owners.
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
    const visible = visibleCommands(client, interaction.user.id);
    const query = interaction.options.getString("command");

    if (!query) {
      await interaction.reply({
        embeds: [buildOverview(visible)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const name = query.toLowerCase().replace(/^\//, "");
    // Only resolve among commands the user is allowed to see, so non-owners
    // can't inspect owner-only commands by name either.
    const command = visible.find((cmd) => cmd.data.name === name);
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

    // Suggest only commands the user can see.
    const choices = visibleCommands(client, interaction.user.id)
      .map((cmd) => cmd.data.name)
      .filter((cmdName) => cmdName.includes(focused))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 25) // Discord allows at most 25 autocomplete choices.
      .map((cmdName) => ({ name: `/${cmdName}`, value: cmdName }));

    await interaction.respond(choices);
  },
});

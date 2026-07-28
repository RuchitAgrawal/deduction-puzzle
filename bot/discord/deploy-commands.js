/*
 * discord/deploy-commands.js
 * Utility script to register slash commands with Discord Developer REST API.
 * Registers to DISCORD_GUILD_ID for rapid development if set, otherwise registers globally.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId  = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error('ERROR: DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in .env file to deploy commands.');
  if (require.main === module) {
    process.exit(1);
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Initiate today\'s mystery investigation or specify a past case ID')
    .addStringOption(option =>
      option.setName('case_id')
        .setDescription('Optional specific case report ID (e.g., case-002) for practice interrogations')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('archive')
    .setDescription('Browse past released investigative mysteries and launch practice investigations'),
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your official officer service report, current standing, and performance statistics'),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the top performing detectives and active solve streaks in this jurisdiction'),
  new SlashCommandBuilder()
    .setName('hint')
    .setDescription('Access an operational clue for your active investigation (note: marks result as assisted)')
].map(command => command.toJSON());

async function deploy() {
  if (!token || !clientId) return;
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application slash commands.`);

    let data;
    if (guildId) {
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} guild slash commands for guild ${guildId}.`);
    } else {
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} global slash commands.`);
    }
  } catch (error) {
    console.error('Failed to deploy slash commands:', error);
  }
}

if (require.main === module) {
  deploy();
}

module.exports = { deploy, commands };

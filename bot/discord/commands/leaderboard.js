/*
 * discord/commands/leaderboard.js
 * Execution logic for /leaderboard slash command in Discord.
 */

const format = require('../formatters');
let db;
try {
  db = require('../../storage/db');
} catch (_) {
  db = null;
}

async function execute(interaction) {
  let topPlayers = [];
  if (db) {
    try {
      topPlayers = db.getLeaderboard(10, 'discord');
    } catch (err) {
      console.error('Failed to query leaderboards:', err.message);
    }
  }

  const guildName = interaction.guild ? interaction.guild.name : 'GLOBAL JURISDICTION';
  const embed     = format.buildLeaderboardEmbed(topPlayers, guildName);

  await interaction.reply({
    embeds: [embed],
    ephemeral: false
  });
}

module.exports = { execute };

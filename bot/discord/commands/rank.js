/*
 * discord/commands/rank.js
 * Execution logic for /rank slash command in Discord.
 */

const ranks  = require('../../engine/ranks');
const format = require('../formatters');
let db;
try {
  db = require('../../storage/db');
} catch (_) {
  db = null;
}

async function execute(interaction) {
  const userId = interaction.user.id;
  let stats    = { total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0 };

  if (db) {
    try {
      stats = db.getPlayerStats(String(userId));
    } catch (err) {
      console.error('Failed to load DB stats in Discord /rank:', err.message);
    }
  }

  const rankLabel    = ranks.getRankLabel(stats);
  const progressText = ranks.getProgressText(stats);
  const embed        = format.buildRankEmbed(stats, rankLabel, progressText);

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

module.exports = { execute };

/*
 * telegram/handlers/rank.js
 * Handlers for checking detective profile standing and officer service reports in Telegram.
 */

const ranks  = require('../../engine/ranks');
const format = require('../formatters');
let db;
try {
  db = require('../../storage/db');
} catch (_) {
  db = null;
}

async function renderRankMessage(ctx, isCallback = false) {
  const userId = ctx.from ? ctx.from.id : null;
  if (!userId) return;

  let stats = { total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0 };
  if (db) {
    try {
      stats = db.getPlayerStats(String(userId));
    } catch (err) {
      console.error('Failed to query player stats:', err.message);
    }
  }

  const rankLabel    = ranks.getRankLabel(stats);
  const progressText = ranks.getProgressText(stats);
  const text         = format.formatRankProfile(stats, rankLabel, progressText);

  if (isCallback) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { parse_mode: 'HTML' }).catch(async () => {
      await ctx.reply(text, { parse_mode: 'HTML' });
    });
  } else {
    await ctx.reply(text, { parse_mode: 'HTML' });
  }
}

async function handleRankCommand(ctx) {
  await renderRankMessage(ctx, false);
}

async function handleRankCallback(ctx) {
  await renderRankMessage(ctx, true);
}

module.exports = {
  handleRankCommand,
  handleRankCallback
};

/*
 * telegram/handlers/result.js
 * Handles accusation confirmation, result evaluation, database stats recording, and result scorecard display in Telegram.
 */

const session = require('../../engine/session');
const ranks   = require('../../engine/ranks');
const format  = require('../formatters');
let db;
try {
  db = require('../../storage/db');
} catch (_) {
  db = null;
}

async function handleConfirmCallback(ctx, callbackData) {
  // data format: "confirm:case-001:Claire Sutton"
  const parts       = callbackData.split(':');
  const caseId      = parts[1];
  const suspectName = parts.slice(2).join(':');

  const userId = ctx.from ? ctx.from.id : null;
  const active = session.getSession(userId);

  if (!active || active.caseId !== caseId) {
    return ctx.answerCallbackQuery({
      text: 'This investigation session is no longer active. Type /play to begin again.',
      show_alert: true
    });
  }

  await ctx.answerCallbackQuery({ text: 'Verifying evidence against actual findings...' });

  const result = session.resolveAccusation(userId, suspectName);
  if (result.error) {
    return ctx.reply('Error confirming accusation: ' + result.error);
  }

  const username = ctx.from.username || ctx.from.first_name || String(userId);
  let playerStats = { total_solved: 0, streak: 0 };

  if (db) {
    try {
      playerStats = db.updatePlayerStats(String(userId), 'telegram', result, username);
      db.logResult(String(userId), caseId, result.correct, result.timeTaken, result.hintUsed);
    } catch (err) {
      console.error('Database write error:', err.message);
    }
  }

  const rankLabel = ranks.getRankLabel(playerStats);
  const text      = format.formatResultCard(result, rankLabel, playerStats);
  const keyboard  = format.buildResultKeyboard(caseId);

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async () => {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  });
}

module.exports = { handleConfirmCallback };

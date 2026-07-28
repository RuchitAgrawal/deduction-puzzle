/*
 * telegram/handlers/daily.js
 * Automated cron schedule to publish the daily mystery briefing to a public Telegram channel at 9:00 AM IST (03:30 UTC).
 */

let cron;
try {
  cron = require('node-cron');
} catch (_) {
  cron = null;
}

const cases  = require('../../engine/cases');
const format = require('../formatters');

function init(bot) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId || !cron || !bot) {
    return;
  }

  // Schedule for 03:30 UTC which corresponds to 09:00 AM IST
  cron.schedule('30 3 * * *', async () => {
    try {
      const todayCase = cases.getCaseForToday();
      if (!todayCase) return;

      const text     = format.formatCaseMessage(todayCase);
      const keyboard = format.buildSuspectKeyboard(todayCase.suspects, todayCase.id);

      await bot.api.sendMessage(channelId, text, { parse_mode: 'HTML', reply_markup: keyboard });
      console.log(`Daily puzzle published to Telegram channel ${channelId} for case ${todayCase.id}`);
    } catch (err) {
      console.error('Error publishing daily Telegram puzzle:', err.message);
    }
  });

  console.log(`Daily Telegram cron schedule initialized for channel ${channelId}`);
}

module.exports = { init };

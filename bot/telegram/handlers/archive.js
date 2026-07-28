/*
 * telegram/handlers/archive.js
 * Handlers for paginated case browsing and selecting practice interrogations in Telegram.
 */

const cases  = require('../../engine/cases');
const format = require('../formatters');

const PAGE_SIZE = 5;

async function renderArchivePage(ctx, page = 0, isCallback = false) {
  const allReleased = cases.getAllReleasedCases();
  const totalPages  = Math.max(1, Math.ceil(allReleased.length / PAGE_SIZE));
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const start     = currentPage * PAGE_SIZE;
  const slice     = allReleased.slice(start, start + PAGE_SIZE);

  const text      = format.formatArchivePage(slice, currentPage, totalPages);
  const keyboard  = format.buildArchiveKeyboard(slice, currentPage, totalPages);

  if (isCallback) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async () => {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    });
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

async function handleArchiveCommand(ctx) {
  await renderArchivePage(ctx, 0, false);
}

async function handleArchiveCallback(ctx, callbackData) {
  // data format: "archive:1"
  const page = parseInt(callbackData.split(':')[1] || '0', 10);
  await renderArchivePage(ctx, page, true);
}

module.exports = {
  handleArchiveCommand,
  handleArchiveCallback
};

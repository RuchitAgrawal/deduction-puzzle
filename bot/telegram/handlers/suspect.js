/*
 * telegram/handlers/suspect.js
 * Handles suspect interrogation selection and returning back to evidence view in Telegram.
 */

const session = require('../../engine/session');
const format  = require('../formatters');

async function handleSuspectCallback(ctx, callbackData) {
  // data format: "suspect:case-001:0"
  const parts      = callbackData.split(':');
  const caseId     = parts[1];
  const suspectIdx = parseInt(parts[2], 10);

  const userId = ctx.from ? ctx.from.id : null;
  const active = session.getSession(userId);

  if (!active || active.caseId !== caseId) {
    return ctx.answerCallbackQuery({
      text: 'This interrogation session has expired. Type /play to launch a fresh briefing.',
      show_alert: true
    });
  }

  const suspect = active.caseData.suspects[suspectIdx];
  if (!suspect) {
    return ctx.answerCallbackQuery({ text: 'Suspect record not found.' });
  }

  await ctx.answerCallbackQuery();
  const text     = format.formatConfirmMessage(suspect.name, suspect.description);
  const keyboard = format.buildConfirmKeyboard(caseId, suspect.name);

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
}

async function handleBackCallback(ctx, callbackData) {
  // data format: "back:case-001"
  const caseId = callbackData.split(':')[1];
  const userId = ctx.from ? ctx.from.id : null;
  const active = session.getSession(userId);

  if (!active || active.caseId !== caseId) {
    return ctx.answerCallbackQuery({
      text: 'Session expired. Type /play to start again.',
      show_alert: true
    });
  }

  await ctx.answerCallbackQuery();
  const hintText = active.hintUsed ? active.caseData.hint : null;
  const text     = format.formatCaseMessage(active.caseData, hintText);
  const keyboard = format.buildSuspectKeyboard(active.caseData.suspects, active.caseId);

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
}

module.exports = {
  handleSuspectCallback,
  handleBackCallback
};

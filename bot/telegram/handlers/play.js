/*
 * telegram/handlers/play.js
 * Handlers for initiating puzzles, requesting clues, and abandoning sessions in Telegram.
 */

const session   = require('../../engine/session');
const cases     = require('../../engine/cases');
const format    = require('../formatters');

async function startSessionAndSendCase(ctx, caseId = null) {
  const userId = ctx.from ? ctx.from.id : (ctx.chat ? ctx.chat.id : null);
  if (!userId) return;

  try {
    const activeSession = session.createSession(userId, 'telegram', caseId);
    const text     = format.formatCaseMessage(activeSession.caseData);
    const keyboard = format.buildSuspectKeyboard(activeSession.caseData.suspects, activeSession.caseId);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  } catch (err) {
    console.error('Error starting case:', err);
    await ctx.reply('Unable to load case file. Please try again later.');
  }
}

async function handlePlayCommand(ctx) {
  // Check if user passed an argument like "/play case-003"
  const text = ctx.message && ctx.message.text ? ctx.message.text : '';
  const parts = text.split(/\s+/);
  const requestedId = parts[1] && parts[1].toLowerCase().startsWith('case-') ? parts[1].toLowerCase() : null;

  await startSessionAndSendCase(ctx, requestedId);
}

async function handlePlaySpecificCase(ctx, callbackData) {
  // data format: "play_case:case-002"
  const caseId = callbackData.split(':')[1];
  await ctx.answerCallbackQuery();
  await startSessionAndSendCase(ctx, caseId);
}

async function handlePlayNextCallback(ctx) {
  await ctx.answerCallbackQuery();
  const all   = cases.getAllReleasedCases();
  const rand  = all[Math.floor(Math.random() * all.length)];
  const caseId = rand ? rand.id : null;
  await startSessionAndSendCase(ctx, caseId);
}

async function handleHintCommand(ctx) {
  const userId = ctx.from ? ctx.from.id : null;
  if (!userId) return;

  const active = session.getSession(userId);
  if (!active) {
    return ctx.reply('No active investigation in progress. Type /play to open today\'s briefing.');
  }

  const clueText = session.useHint(userId);
  const text     = format.formatCaseMessage(active.caseData, clueText);
  const keyboard = format.buildSuspectKeyboard(active.caseData.suspects, active.caseId);

  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

async function handleHintCallback(ctx, callbackData) {
  const userId = ctx.from ? ctx.from.id : null;
  if (!userId) return ctx.answerCallbackQuery({ text: 'Authentication error' });

  const active = session.getSession(userId);
  if (!active) {
    return ctx.answerCallbackQuery({ text: 'Session expired. Type /play to restart.', show_alert: true });
  }

  const clueText = session.useHint(userId);
  const text     = format.formatCaseMessage(active.caseData, clueText);
  const keyboard = format.buildSuspectKeyboard(active.caseData.suspects, active.caseId);

  await ctx.answerCallbackQuery({ text: 'Clue accessed. Note: assisted solve recorded.' });
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
}

async function handleQuitCommand(ctx) {
  const userId = ctx.from ? ctx.from.id : null;
  if (!userId) return;

  const active = session.getSession(userId);
  if (!active) {
    return ctx.reply('No active investigation to abandon.');
  }

  session.clearSession(userId);
  await ctx.reply('Investigation abandoned. Your case file has been closed without a verdict.');
}

async function handleQuitCallback(ctx, callbackData) {
  const userId = ctx.from ? ctx.from.id : null;
  if (userId) session.clearSession(userId);

  await ctx.answerCallbackQuery({ text: 'Investigation abandoned.' });
  await ctx.editMessageText('<b>INTERROGATION ABANDONED</b>\n\nThis investigation session has been terminated by the detective. Type /play to launch a fresh interrogation.', { parse_mode: 'HTML' }).catch(() => {});
}

module.exports = {
  startSessionAndSendCase,
  handlePlayCommand,
  handlePlaySpecificCase,
  handlePlayNextCallback,
  handleHintCommand,
  handleHintCallback,
  handleQuitCommand,
  handleQuitCallback
};

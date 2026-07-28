/*
 * telegram/index.js
 * Main entry point for the Deduction Puzzle Telegram bot using grammy.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Bot, HttpError, GrammyError } = require('grammy');
const playHandler    = require('./handlers/play');
const suspectHandler = require('./handlers/suspect');
const resultHandler  = require('./handlers/result');
const rankHandler    = require('./handlers/rank');
const archiveHandler = require('./handlers/archive');
const dailyCron      = require('./handlers/daily');

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('ERROR: TELEGRAM_TOKEN is missing in environment or .env file.');
  if (require.main === module) {
    process.exit(1);
  }
}

const bot = token ? new Bot(token) : null;

if (bot) {
  // Command registration and menu hints
  bot.api.setMyCommands([
    { command: 'play',    description: 'Begin today\'s investigative puzzle' },
    { command: 'archive', description: 'Browse and replay past case files' },
    { command: 'rank',    description: 'View your officer service report and stats' },
    { command: 'hint',    description: 'Request an investigative clue for active case' },
    { command: 'quit',    description: 'Abandon current active interrogation' },
    { command: 'help',    description: 'Show general instructions and command guide' }
  ]).catch(e => console.error('Failed to set bot commands:', e.message));

  // Basic commands
  bot.command('start', async (ctx) => {
    const welcome = `<b>Welcome to the Deduction Puzzle Investigative Bot</b>\n\n` +
      `Test your analytical precision by solving daily logical murder and deception mysteries. Each day at 9:00 AM IST, a new official case file is unlocked for field analysis.\n\n` +
      `<b>AVAILABLE COMMANDS :</b>\n` +
      `/play : Open today's investigation\n` +
      `/archive : Review past released case reports\n` +
      `/rank : Check your officer standing and solve rates\n` +
      `/hint : Access operational clues during an active case\n` +
      `/help : View procedural guidelines`;
    await ctx.reply(welcome, { parse_mode: 'HTML' });
  });

  bot.command('help', async (ctx) => {
    const helpText = `<b>FIELD INVESTIGATION GUIDE</b>\n\n` +
      `1. Use /play to receive the daily briefing and review all witness testimony and physical evidence.\n` +
      `2. Examine the suspect statements carefully for logical contradictions, false timelines, or confirmed alibis.\n` +
      `3. Tap on a suspect button to name your primary perpetrator. You will be asked to confirm your verdict.\n` +
      `4. Requesting a /hint provides vital operational support but marks the result as an assisted solve.\n` +
      `5. Build consecutive streaks and accumulate solved cases to advance from Tier I Cadet up to Tier V Master Detective.`;
    await ctx.reply(helpText, { parse_mode: 'HTML' });
  });

  // Bind command handlers
  bot.command('play', playHandler.handlePlayCommand);
  bot.command('hint', playHandler.handleHintCommand);
  bot.command('quit', playHandler.handleQuitCommand);
  bot.command('rank', rankHandler.handleRankCommand);
  bot.command('archive', archiveHandler.handleArchiveCommand);

  // Bind callback query handlers
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    try {
      if (data.startsWith('suspect:')) {
        await suspectHandler.handleSuspectCallback(ctx, data);
      } else if (data.startsWith('confirm:')) {
        await resultHandler.handleConfirmCallback(ctx, data);
      } else if (data.startsWith('back:')) {
        await suspectHandler.handleBackCallback(ctx, data);
      } else if (data.startsWith('hint:')) {
        await playHandler.handleHintCallback(ctx, data);
      } else if (data.startsWith('quit:')) {
        await playHandler.handleQuitCallback(ctx, data);
      } else if (data === 'rank') {
        await rankHandler.handleRankCallback(ctx);
      } else if (data.startsWith('archive:')) {
        await archiveHandler.handleArchiveCallback(ctx, data);
      } else if (data.startsWith('play_case:')) {
        await playHandler.handlePlaySpecificCase(ctx, data);
      } else if (data === 'play_next') {
        await playHandler.handlePlayNextCallback(ctx);
      } else {
        await ctx.answerCallbackQuery({ text: 'Unknown operation' });
      }
    } catch (err) {
      console.error('Callback error:', err);
      await ctx.answerCallbackQuery({ text: 'An error occurred processing your request.' }).catch(() => {});
    }
  });

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
      console.error('Could not contact Telegram:', e);
    } else {
      console.error('Unknown error:', e);
    }
  });

  // Start scheduled daily puzzle posts if configured
  dailyCron.init(bot);

  // Start long polling if executed directly
  if (require.main === module) {
    bot.start({
      onStart: (botInfo) => console.log(`Telegram Bot started as @${botInfo.username}`)
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}

module.exports = { bot };

/*
 * bot/index.js
 * Convenience entry point: starts both Telegram and Discord bots in a single process.
 * Useful for development or lightweight deployments where running two separate processes is not needed.
 * For production, prefer using pm2 with ecosystem.config.js to run each bot independently.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const hasTelegram = Boolean(process.env.TELEGRAM_TOKEN);
const hasDiscord  = Boolean(process.env.DISCORD_TOKEN);

if (!hasTelegram && !hasDiscord) {
  console.error(
    'No bot tokens configured. Set TELEGRAM_TOKEN or DISCORD_TOKEN in the .env file.\n' +
    'Copy .env.example to .env and fill in the required values.'
  );
  process.exit(1);
}

if (hasTelegram) {
  console.log('[launcher] Starting Telegram bot...');
  require('./telegram/index');
} else {
  console.log('[launcher] TELEGRAM_TOKEN not set. Skipping Telegram bot.');
}

if (hasDiscord) {
  console.log('[launcher] Starting Discord bot...');
  require('./discord/index');
} else {
  console.log('[launcher] DISCORD_TOKEN not set. Skipping Discord bot.');
}

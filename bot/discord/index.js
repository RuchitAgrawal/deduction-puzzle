/*
 * discord/index.js
 * Main entry point for the Deduction Puzzle Discord bot using discord.js v14.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client, GatewayIntentBits, Events } = require('discord.js');
const playCommand        = require('./commands/play');
const archiveCommand     = require('./commands/archive');
const rankCommand        = require('./commands/rank');
const leaderboardCommand = require('./commands/leaderboard');
const buttonHandler      = require('./handlers/button');
const cases              = require('../engine/cases');
const format             = require('./formatters');

let cron;
try {
  cron = require('node-cron');
} catch (_) {
  cron = null;
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('ERROR: DISCORD_TOKEN is missing in environment or .env file.');
  if (require.main === module) {
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, (c) => {
  console.log(`Discord Bot logged in successfully as ${c.user.tag}`);
  initDailyCron(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'play') {
        await playCommand.execute(interaction);
      } else if (commandName === 'archive') {
        await archiveCommand.execute(interaction);
      } else if (commandName === 'rank') {
        await rankCommand.execute(interaction);
      } else if (commandName === 'leaderboard') {
        await leaderboardCommand.execute(interaction);
      } else if (commandName === 'hint') {
        await playCommand.executeHint(interaction);
      }
    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await buttonHandler.handleComponent(interaction);
    }
  } catch (error) {
    console.error('Error handling Discord interaction:', error);
    const reply = { content: 'An unexpected operational error occurred while executing this directive.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

function initDailyCron(botClient) {
  const channelId = process.env.DISCORD_DAILY_CHANNEL_ID;
  if (!channelId || !cron) return;

  // 03:30 UTC corresponds to 09:00 AM IST
  cron.schedule('30 3 * * *', async () => {
    try {
      const channel = await botClient.channels.fetch(channelId);
      if (!channel) return;

      const todayCase = cases.getCaseForToday();
      if (!todayCase) return;

      const embed      = format.buildCaseEmbed(todayCase);
      const components = format.buildSuspectComponents(todayCase.suspects, todayCase.id);

      await channel.send({ content: '**New Daily Case Report Unlocked**', embeds: [embed], components: components });
      console.log(`Daily puzzle posted to Discord channel ${channelId}`);
    } catch (err) {
      console.error('Error in daily Discord cron:', err.message);
    }
  });

  console.log(`Daily Discord cron schedule initialized for channel ${channelId}`);
}

if (require.main === module && token) {
  client.login(token).catch(err => console.error('Discord login failure:', err.message));
}

module.exports = { client };

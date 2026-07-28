/*
 * discord/commands/play.js
 * Execution logic for /play and /hint slash commands in Discord.
 */

const session = require('../../engine/session');
const format  = require('../formatters');

async function execute(interaction) {
  const userId        = interaction.user.id;
  const requestedId   = interaction.options.getString('case_id') || null;

  try {
    const activeSession = session.createSession(userId, 'discord', requestedId);
    const embed         = format.buildCaseEmbed(activeSession.caseData);
    const components    = format.buildSuspectComponents(activeSession.caseData.suspects, activeSession.caseId);

    // Reply privately or in channel based on preference; public messages build community activity
    await interaction.reply({
      content: `**Investigator <@${userId}> has opened an official case briefing.**`,
      embeds: [embed],
      components: components
    });
  } catch (err) {
    console.error('Error in Discord /play:', err.message);
    await interaction.reply({
      content: 'Failed to initialize case briefing. Please check the requested Case ID or try again later.',
      ephemeral: true
    });
  }
}

async function executeHint(interaction) {
  const userId = interaction.user.id;
  const active = session.getSession(userId);

  if (!active) {
    return interaction.reply({
      content: 'No active investigation running under your credentials. Launch an inquiry first using `/play`.',
      ephemeral: true
    });
  }

  const clueText   = session.useHint(userId);
  const embed      = format.buildCaseEmbed(active.caseData, clueText);
  const components = format.buildSuspectComponents(active.caseData.suspects, active.caseId);

  await interaction.reply({
    content: `**Operational Clue Deceptively Accessed (Assisted Solve Flagged)**`,
    embeds: [embed],
    components: components,
    ephemeral: true
  });
}

module.exports = { execute, executeHint };

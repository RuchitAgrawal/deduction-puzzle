/*
 * discord/handlers/button.js
 * Dispatcher for interactive button clicks and select menus in Discord.
 */

const session = require('../../engine/session');
const cases   = require('../../engine/cases');
const ranks   = require('../../engine/ranks');
const format  = require('../formatters');

let db;
try {
  db = require('../../storage/db');
} catch (_) {
  db = null;
}

async function handleComponent(interaction) {
  const customId = interaction.customId;
  const userId   = interaction.user.id;

  if (interaction.isStringSelectMenu() && customId === 'archive_select') {
    const selectedCaseId = interaction.values[0];
    try {
      const activeSession = session.createSession(userId, 'discord', selectedCaseId);
      const embed      = format.buildCaseEmbed(activeSession.caseData);
      const components = format.buildSuspectComponents(activeSession.caseData.suspects, activeSession.caseId);
      await interaction.reply({
        content: `**Practice Interrogation Initiated by <@${userId}>**`,
        embeds: [embed],
        components: components
      });
    } catch (err) {
      await interaction.reply({ content: 'Could not load requested mystery file.', ephemeral: true });
    }
    return;
  }

  if (customId.startsWith('suspect_')) {
    // "suspect_case-001_0"
    const parts      = customId.split('_');
    const caseId     = parts[1];
    const suspectIdx = parseInt(parts[2], 10);
    const active     = session.getSession(userId);

    if (!active || active.caseId !== caseId) {
      return interaction.reply({ content: 'This interrogation briefing has expired. Type `/play` to begin anew.', ephemeral: true });
    }

    const suspect = active.caseData.suspects[suspectIdx];
    if (!suspect) {
      return interaction.reply({ content: 'Suspect record missing.', ephemeral: true });
    }

    const embed      = format.buildConfirmEmbed(suspect.name, suspect.description);
    const components = format.buildConfirmComponents(caseId, suspect.name);
    await interaction.update({ embeds: [embed], components: components });

  } else if (customId.startsWith('confirm_')) {
    // "confirm_case-001_Claire Sutton"
    const parts       = customId.split('_');
    const caseId      = parts[1];
    const suspectName = parts.slice(2).join('_');
    const active      = session.getSession(userId);

    if (!active || active.caseId !== caseId) {
      return interaction.reply({ content: 'Investigation session expired. Launch a new briefing via `/play`.', ephemeral: true });
    }

    const result = session.resolveAccusation(userId, suspectName);
    if (result.error) {
      return interaction.reply({ content: result.error, ephemeral: true });
    }

    const username = interaction.user.username || interaction.user.tag || String(userId);
    let stats    = { total_solved: 0, streak: 0 };
    if (db) {
      try {
        stats = db.updatePlayerStats(String(userId), 'discord', result, username);
        db.logResult(String(userId), caseId, result.correct, result.timeTaken, result.hintUsed);
      } catch (err) {
        console.error('Database log failure:', err.message);
      }
    }

    const rankLabel  = ranks.getRankLabel(stats);
    const embed      = format.buildResultEmbed(result, rankLabel, stats);
    const components = format.buildResultComponents(caseId);

    await interaction.update({ content: null, embeds: [embed], components: components });

  } else if (customId.startsWith('back_')) {
    const caseId = customId.split('_')[1];
    const active = session.getSession(userId);

    if (!active || active.caseId !== caseId) {
      return interaction.reply({ content: 'Session expired. Type `/play` to start again.', ephemeral: true });
    }

    const hintText   = active.hintUsed ? active.caseData.hint : null;
    const embed      = format.buildCaseEmbed(active.caseData, hintText);
    const components = format.buildSuspectComponents(active.caseData.suspects, active.caseId);
    await interaction.update({ embeds: [embed], components: components });

  } else if (customId.startsWith('hint_')) {
    const active = session.getSession(userId);
    if (!active) {
      return interaction.reply({ content: 'No active mystery running under your credentials.', ephemeral: true });
    }

    const clueText   = session.useHint(userId);
    const embed      = format.buildCaseEmbed(active.caseData, clueText);
    const components = format.buildSuspectComponents(active.caseData.suspects, active.caseId);

    if (interaction.message && interaction.message.editable) {
      await interaction.update({ embeds: [embed], components: components });
      await interaction.followUp({ content: '**Operational Clue Revealed** : Note that assisted solve is now recorded.', ephemeral: true });
    } else {
      await interaction.reply({ content: '**Operational Clue Deceptively Accessed (Assisted Solve Flagged)**', embeds: [embed], components: components, ephemeral: true });
    }

  } else if (customId.startsWith('quit_')) {
    session.clearSession(userId);
    await interaction.update({ content: '**INTERROGATION ABANDONED**\nThe detective has closed this inquiry without rendering a verdict.', embeds: [], components: [] });

  } else if (customId === 'play_next') {
    const all    = cases.getAllReleasedCases();
    const random = all[Math.floor(Math.random() * all.length)];
    const caseId = random ? random.id : null;

    try {
      const activeSession = session.createSession(userId, 'discord', caseId);
      const embed      = format.buildCaseEmbed(activeSession.caseData);
      const components = format.buildSuspectComponents(activeSession.caseData.suspects, activeSession.caseId);
      await interaction.reply({ content: `**New Investigation Briefing Opened by <@${userId}>**`, embeds: [embed], components: components });
    } catch (err) {
      await interaction.reply({ content: 'Failed to start next case.', ephemeral: true });
    }

  } else if (customId === 'view_rank') {
    let stats = { total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0 };
    if (db) {
      try { stats = db.getPlayerStats(String(userId)); } catch (_) {}
    }
    const rankLabel    = ranks.getRankLabel(stats);
    const progressText = ranks.getProgressText(stats);
    const embed        = format.buildRankEmbed(stats, rankLabel, progressText);
    await interaction.reply({ embeds: [embed], ephemeral: true });

  } else if (customId.startsWith('browse_archive_')) {
    const page      = parseInt(customId.split('_')[2] || '0', 10);
    const all       = cases.getAllReleasedCases();
    const PAGE_SIZE = 5;
    const total     = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const start     = page * PAGE_SIZE;
    const slice     = all.slice(start, start + PAGE_SIZE);

    const embed      = format.buildArchiveEmbed(slice, page, total);
    const components = format.buildArchiveComponents(slice, page, total);

    if (interaction.message && interaction.message.editable) {
      await interaction.update({ embeds: [embed], components: components });
    } else {
      await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
    }
  }
}

module.exports = { handleComponent };

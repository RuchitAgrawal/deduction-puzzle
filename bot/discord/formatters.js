/*
 * discord/formatters.js
 * Builds Discord Embeds and Action Rows for case files, suspect selection buttons, confirmation prompts, officer service reports, leaderboards, and archive lists.
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const AMBER_COLOR   = 0xe8943a;
const GREEN_COLOR   = 0x10b981;
const RED_COLOR     = 0xef4444;
const OBSIDIAN_GRAY = 0x181a1f;

function buildCaseEmbed(caseData, hintText = null) {
  const displayId = (caseData.id || '').toUpperCase().replace('CASE-', 'CASE #');
  
  const embed = new EmbedBuilder()
    .setColor(AMBER_COLOR)
    .setTitle(`${displayId} : "${caseData.title}"`)
    .setDescription(caseData.intro)
    .setFooter({ text: 'Deduction Puzzle | Field Investigation Mode' })
    .setTimestamp();

  if (caseData.arc) {
    embed.setAuthor({ name: `[ ${caseData.arc} ]` });
  }

  const clueText = (caseData.clues || []).map((c, i) => `**${i + 1}.** ${c}`).join('\n\n');
  embed.addFields(
    { name: 'INVESTIGATIVE EVIDENCE', value: clueText || 'No evidence items recorded.' },
    { name: 'CLASSIFICATION', value: `Difficulty: **${(caseData.difficulty || 'easy').toUpperCase()}** | Category: **${caseData.category || 'general'}**`, inline: false }
  );

  if (hintText) {
    embed.addFields({ name: 'OPERATIONAL CLUE (ASSISTANCE ENABLED)', value: hintText });
  }

  return embed;
}

function buildSuspectComponents(suspects, caseId) {
  const row1 = new ActionRowBuilder();
  
  (suspects || []).slice(0, 5).forEach((s, idx) => {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`suspect_${caseId}_${idx}`)
        .setLabel(`Accuse: ${s.name}`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hint_${caseId}`)
      .setLabel(`Request Clue`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`quit_${caseId}`)
      .setLabel(`Abandon Case`)
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

function buildConfirmEmbed(suspectName, description) {
  return new EmbedBuilder()
    .setColor(AMBER_COLOR)
    .setTitle('ACCUSATION CONFIRMATION')
    .setDescription(`You are preparing to formally submit **${suspectName}** as the primary perpetrator in this mystery.\n\n*"${description}"*\n\nAre you ready to finalize your verdict? Once submitted, the case will be closed immediately.`)
    .setFooter({ text: 'Warning: Unverified verdicts impact your officer solve rate.' });
}

function buildConfirmComponents(caseId, suspectName) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_${caseId}_${suspectName}`)
      .setLabel(`Confirm Verdict`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`back_${caseId}`)
      .setLabel(`Return to Evidence`)
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

function buildResultEmbed(result, rankLabel, stats) {
  const verdict    = result.correct ? 'CASE CLOSED // SOLVED' : 'COLD CASE // INCORRECT VERDICT';
  const color      = result.correct ? GREEN_COLOR : RED_COLOR;
  const statusText = result.correct ? '**TRUE VERDICT**' : '**FALSE ALIBI**';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(verdict)
    .setDescription(`Subject Investigation: **"${result.caseTitle}"**`)
    .addFields(
      { name: 'YOUR ACCUSATION', value: `${result.suspectName} (${statusText})`, inline: true },
      { name: 'TRUE SOLUTION',   value: result.solution, inline: true },
      { name: 'INVESTIGATION TIME', value: `${result.timeTaken}s`, inline: true },
      { name: 'OFFICIAL DEBRIEFING', value: result.explanation }
    )
    .setFooter({ text: `Current Standing: ${rankLabel} | Total Solved: ${stats.total_solved || 0} | Streak: ${stats.streak || 0}` })
    .setTimestamp();

  if (result.epilogue) {
    embed.addFields({ name: 'INTELLIGENCE EPILOGUE', value: `*${result.epilogue}*` });
  }

  return embed;
}

function buildResultComponents(caseId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`play_next`)
      .setLabel(`Next Interrogation`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`view_rank`)
      .setLabel(`Officer Service Report`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`browse_archive_0`)
      .setLabel(`Case Archive`)
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

function buildRankEmbed(stats, rankLabel, progressText) {
  return new EmbedBuilder()
    .setColor(AMBER_COLOR)
    .setTitle('OFFICER SERVICE REPORT')
    .setDescription(`Current Tier: **${rankLabel}**\nProgression Status: ${progressText}`)
    .addFields(
      { name: 'Total Investigations', value: String(stats.total_played || 0), inline: true },
      { name: 'Successful Solves',    value: String(stats.total_solved || 0), inline: true },
      { name: 'Clean Solves (Zero Hints)', value: String(stats.clean_solves || 0), inline: true },
      { name: 'Hardcore Challenge Solves', value: String(stats.hardcore_solves || 0), inline: true },
      { name: 'Consecutive Streak',   value: String(stats.streak || 0), inline: true },
      { name: 'Fastest Investigation', value: stats.fastest_time ? `${stats.fastest_time}s` : 'N/A', inline: true }
    )
    .setFooter({ text: 'Deduction Puzzle | Personnel Records Division' });
}

function buildLeaderboardEmbed(players, guildName) {
  const embed = new EmbedBuilder()
    .setColor(AMBER_COLOR)
    .setTitle(`TOP DETECTIVES // ${guildName || 'GLOBAL ARCHIVE'}`)
    .setDescription('Highest performing field operatives ranked by total solved mysteries and active consecutive streaks.')
    .setFooter({ text: 'Deduction Puzzle | Division Leaderboards' });

  if (!players || players.length === 0) {
    embed.addFields({ name: 'No Data Found', value: 'No operational records established in this jurisdiction yet.' });
    return embed;
  }

  let listText = '';
  players.forEach((p, index) => {
    const rankNum = index + 1;
    const name    = p.username || p.id;
    listText += `**#${rankNum}** : **${name}** (Solved: ${p.total_solved || 0} | Streak: ${p.streak || 0})\n`;
  });

  embed.addFields({ name: 'RANKINGS', value: listText });
  return embed;
}

function buildArchiveEmbed(casesList, page, totalPages) {
  const embed = new EmbedBuilder()
    .setColor(OBSIDIAN_GRAY)
    .setTitle(`INVESTIGATION ARCHIVE (PAGE ${page + 1} / ${totalPages})`)
    .setDescription('Select an archived mystery below to initiate a practice interrogation.')
    .setFooter({ text: 'Deduction Puzzle | Released Files Collection' });

  casesList.forEach(c => {
    const displayId = c.id.toUpperCase().replace('CASE-', 'CASE #');
    embed.addFields({
      name: `${displayId} : "${c.title}"`,
      value: `Difficulty: **${(c.difficulty || 'easy').toUpperCase()}** | Category: **${c.category || 'general'}**`
    });
  });

  return embed;
}

function buildArchiveComponents(casesList, page, totalPages) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('archive_select')
    .setPlaceholder('Select a mystery to investigate...')
    .addOptions(
      casesList.map(c => ({
        label: `${c.id.toUpperCase()}: ${c.title.substring(0, 50)}`,
        description: `Difficulty: ${c.difficulty || 'easy'}`,
        value: c.id
      }))
    );

  const row1 = new ActionRowBuilder().addComponents(selectMenu);

  const navRow = new ActionRowBuilder();
  if (page > 0) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`browse_archive_${page - 1}`)
        .setLabel(`Previous Page`)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (page < totalPages - 1) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`browse_archive_${page + 1}`)
        .setLabel(`Next Page`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return navRow.components.length > 0 ? [row1, navRow] : [row1];
}

module.exports = {
  buildCaseEmbed,
  buildSuspectComponents,
  buildConfirmEmbed,
  buildConfirmComponents,
  buildResultEmbed,
  buildResultComponents,
  buildRankEmbed,
  buildLeaderboardEmbed,
  buildArchiveEmbed,
  buildArchiveComponents
};

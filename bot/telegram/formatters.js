/*
 * telegram/formatters.js
 * Formats game cases, evidence lists, scorecard profiles, and result briefings for Telegram messages.
 */

const { InlineKeyboard } = require('grammy');

function formatCaseMessage(caseData, hintText = null) {
  const displayId = (caseData.id || '').toUpperCase().replace('CASE-', 'CASE #');
  const arcBadge  = caseData.arc ? `\n[ ${caseData.arc} ]` : '';
  
  let text = `<b>${displayId} : "${caseData.title}"</b>${arcBadge}\n`;
  text += `Difficulty: <b>${(caseData.difficulty || 'easy').toUpperCase()}</b> | Category: <b>${caseData.category || 'general'}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `${caseData.intro}\n\n`;
  text += `<b>INVESTIGATIVE EVIDENCE :</b>\n`;
  
  (caseData.clues || []).forEach((clue, idx) => {
    text += `${idx + 1}. ${clue}\n`;
  });

  if (hintText) {
    text += `\n<b>FIELD HINT :</b> ${hintText}\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Review the suspects below and select whom to interrogate and accuse:`;

  return text;
}

function buildSuspectKeyboard(suspects, caseId) {
  const keyboard = new InlineKeyboard();
  
  (suspects || []).forEach((s, idx) => {
    keyboard.text(`[Accuse] ${s.name}`, `suspect:${caseId}:${idx}`).row();
  });
  
  keyboard.text(`Request Hint`, `hint:${caseId}`).text(`Abandon Case`, `quit:${caseId}`);
  
  return keyboard;
}

function formatConfirmMessage(suspectName, description) {
  let text = `<b>ACCUSATION CONFIRMATION</b>\n\n`;
  text += `You are preparing to formally accuse <b>${suspectName}</b> as the perpetrator in this case.\n`;
  text += `<i>"${description}"</i>\n\n`;
  text += `Are you ready to submit your final verdict? This action will close the interrogation and cannot be undone.`;
  return text;
}

function buildConfirmKeyboard(caseId, suspectName) {
  return new InlineKeyboard()
    .text(`Confirm Accusation`, `confirm:${caseId}:${suspectName}`)
    .text(`Return to Clues`, `back:${caseId}`);
}

function formatResultCard(result, rankLabel, stats) {
  const verdict = result.correct ? 'CASE CLOSED // SOLVED' : 'COLD CASE // INCORRECT VERDICT';
  const statusIcon = result.correct ? '[TRUE VERDICT]' : '[FALSE ALIBI]';
  
  let text = `<b>${verdict}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Subject: "${result.caseTitle}"\n`;
  text += `Your Accusation: <b>${result.suspectName}</b> ${statusIcon}\n`;
  text += `Actual Solution: <b>${result.solution}</b>\n`;
  text += `Investigation Time: <b>${result.timeTaken}s</b>\n`;
  text += `Hints Accessed: <b>${result.hintUsed ? '1 (Assisted)' : '0 (Clean Solve)'}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `<b>OFFICIAL DEBRIEFING :</b>\n${result.explanation}\n\n`;

  if (result.epilogue) {
    text += `<b>INTELLIGENCE EPILOGUE :</b>\n<i>${result.epilogue}</i>\n\n`;
  }

  text += `Current Rank: <b>${rankLabel}</b>\n`;
  text += `Total Solved: ${stats.total_solved || 0} | Current Streak: ${stats.streak || 0} cases`;

  return text;
}

function buildResultKeyboard(caseId) {
  return new InlineKeyboard()
    .text(`View Scorecard`, `rank`).text(`Browse Archive`, `archive:0`).row()
    .text(`Play Another Case`, `play_next`);
}

function formatRankProfile(stats, rankLabel, progressText) {
  let text = `<b>OFFICER SERVICE REPORT</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Current Tier: <b>${rankLabel}</b>\n`;
  text += `Progression Status: ${progressText}\n\n`;
  text += `<b>OPERATIONAL STATISTICS :</b>\n`;
  text += `Total Investigations: <b>${stats.total_played || 0}</b>\n`;
  text += `Successful Solves: <b>${stats.total_solved || 0}</b>\n`;
  text += `Clean Solves (Zero Hints): <b>${stats.clean_solves || 0}</b>\n`;
  text += `Hardcore Challenge Solves: <b>${stats.hardcore_solves || 0}</b>\n`;
  text += `Current Consecutive Streak: <b>${stats.streak || 0}</b>\n`;
  text += `Fastest Investigation Time: <b>${stats.fastest_time ? (stats.fastest_time + 's') : 'N/A'}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━`;
  return text;
}

function formatArchivePage(casesList, page, totalPages) {
  let text = `<b>INVESTIGATION ARCHIVE (PAGE ${page + 1} / ${totalPages})</b>\n`;
  text += `Select any case below to begin a practice interrogation:\n\n`;
  
  casesList.forEach(c => {
    const idStr = c.id.toUpperCase().replace('CASE-', '#');
    text += `<b>${idStr}</b> : "${c.title}" [${c.difficulty || 'easy'}]\n`;
  });
  
  return text;
}

function buildArchiveKeyboard(casesList, page, totalPages) {
  const keyboard = new InlineKeyboard();
  
  casesList.forEach(c => {
    const idStr = c.id.toUpperCase().replace('CASE-', '#');
    keyboard.text(`${idStr}: ${c.title.substring(0, 24)}...`, `play_case:${c.id}`).row();
  });
  
  if (page > 0) {
    keyboard.text(`Previous`, `archive:${page - 1}`);
  }
  if (page < totalPages - 1) {
    keyboard.text(`Next`, `archive:${page + 1}`);
  }
  
  return keyboard;
}

module.exports = {
  formatCaseMessage,
  buildSuspectKeyboard,
  formatConfirmMessage,
  buildConfirmKeyboard,
  formatResultCard,
  buildResultKeyboard,
  formatRankProfile,
  formatArchivePage,
  buildArchiveKeyboard
};

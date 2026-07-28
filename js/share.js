/*
 * share.js
 * Wires up the share button on the result screen.
 * Uses the Web Share API on mobile with a clipboard fallback on desktop.
 * Generates an attractive, card-style Case Report for Reddit/Discord/WhatsApp.
 * Depends on: state, getStreak (from game.js), trackEvent (from analytics.js)
 */

function setupShareButton(correct, timeRemaining, timeTaken) {
  var btn = document.getElementById('share-btn');
  var rawId = state.currentCase ? state.currentCase.id : '';
  var displayId = rawId ? rawId.toUpperCase().replace('CASE-', 'CASE #') : 'CASE';
  var caseTitle = state.currentCase ? state.currentCase.title : 'The Puzzle';
  var url = window.location.origin + (rawId ? ('/?id=' + encodeURIComponent(rawId)) : '');
  var hintUsed = state.hintUsed;
  var streak = typeof getStreak === 'function' ? getStreak() : 0;
  var rank = typeof getPlayerRank === 'function' ? getPlayerRank() : { icon: 'I', title: 'Cadet', tier: 'Tier I' };
  var isHardcore = state.hardcoreMode;

  var lines = [];
  lines.push((isHardcore ? 'HARDCORE CHALLENGE REPORT // ' : 'INVESTIGATIVE CASE REPORT // ') + displayId);
  lines.push('--------------------------------------');
  lines.push('SUBJECT: "' + caseTitle + '"');
  lines.push('OFFICER: ' + (rank.tier ? (rank.tier + ' • ') : '') + rank.title);

  if (correct) {
    lines.push('VERDICT: CASE CLOSED' + (isHardcore ? ' [HARDCORE]' : ''));
    lines.push('INVESTIGATION TIME: ' + timeTaken + 's');
    lines.push('HINTS ACCESSED: ' + (hintUsed ? '1 (Assisted)' : '0 (Clean Solve)'));
    if (streak >= 1) {
      lines.push('CURRENT STREAK: ' + streak + ' consecutive cases');
    }
  } else {
    lines.push('VERDICT: COLD CASE' + (isHardcore ? ' [HARDCORE]' : ''));
    lines.push('TIME EXPIRED: Time out during interrogation');
    lines.push('HINTS ACCESSED: ' + (hintUsed ? '1 (Assisted)' : 'None'));
  }

  lines.push('--------------------------------------');
  lines.push(correct ? 'Compare analytical speeds in the archive:' : 'Examine the suspect testimony in the archive:');
  lines.push('');
  lines.push(url);

  var cardText = lines.join('\n');

  // Replace any existing listeners by cloning the node
  var fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.addEventListener('click', async function () {
    trackEvent('share_clicked', { case_id: rawId, correct: correct });

    if (navigator.share) {
      try {
        await navigator.share({ text: cardText });
        return;
      } catch (_) {
        // User cancelled share dialog; fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(cardText);
      fresh.textContent = '[Report Copied to Clipboard]';
      fresh.disabled = true;
    } catch (_) {
      fresh.textContent = 'Copy failed';
    }
  });
}


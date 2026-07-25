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
  var rank = typeof getPlayerRank === 'function' ? getPlayerRank() : { icon: '🔍', title: 'Cadet' };
  var isHardcore = state.hardcoreMode;

  var lines = [];
  lines.push((isHardcore ? '💀 HARDCORE REPORT • ' : '🕵️ DETECTIVE REPORT • ') + displayId);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('📁 "' + caseTitle + '"');
  lines.push('🏅 RANK: ' + rank.icon + ' ' + rank.title);

  if (correct) {
    lines.push('🟩 STATUS: SOLVED!' + (isHardcore ? ' (Hardcore 💀)' : ''));
    lines.push('⏱️ TIME TAKEN: ' + timeTaken + 's');
    lines.push('💡 HINTS: ' + (hintUsed ? 'Used' : '0 (Clean Solve 🎯)'));
    if (streak >= 1) {
      lines.push('🔥 STREAK: ' + streak + '-case');
    }
  } else {
    lines.push('🟥 STATUS: COLD CASE' + (isHardcore ? ' (Hardcore 💀)' : ''));
    lines.push('⏱️ TIME: Time Out');
    lines.push('💡 HINTS: ' + (hintUsed ? 'Used' : 'None'));
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(correct ? 'Think you can beat my time? 👇' : 'Can you crack the suspect\'s alibi? 👇');
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
      fresh.textContent = '✅ Case Report Copied!';
      fresh.disabled = true;
    } catch (_) {
      fresh.textContent = 'Copy failed';
    }
  });
}


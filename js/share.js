/*
 * share.js
 * Wires up the share button on the result screen.
 * Uses the Web Share API on mobile with a clipboard fallback on desktop.
 * Depends on: state (from game.js), trackEvent (from analytics.js)
 */

function setupShareButton(correct, timeRemaining, timeTaken) {
  var btn = document.getElementById('share-btn');
  var caseId = state.currentCase ? state.currentCase.id : '';
  var caseTitle = state.currentCase ? state.currentCase.title : 'the puzzle';
  var url = window.location.origin + '/?id=' + encodeURIComponent(caseId);

  var text;
  if (correct) {
    text = 'Solved "' + caseTitle + '" with ' + timeRemaining + 's left. Can you do it in under ' + timeTaken + 's?';
  } else {
    text = 'Could not crack "' + caseTitle + '" before time ran out. Give it a try.';
  }

  // Replace any existing listeners by cloning the node
  var fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.addEventListener('click', async function () {
    trackEvent('share_clicked', { case_id: caseId, correct: correct });

    if (navigator.share) {
      try {
        await navigator.share({ text: text + ' ' + url });
        return;
      } catch (_) {
        // User cancelled share dialog; fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text + ' ' + url);
      fresh.textContent = 'Copied to clipboard';
      fresh.disabled = true;
    } catch (_) {
      fresh.textContent = 'Copy failed';
    }
  });
}

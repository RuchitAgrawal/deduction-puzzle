/*
 * game.js
 * Core game logic: case loading, timer, suspect selection,
 * accusation flow, result display, streak tracking, and hint system.
 *
 * Depends on: analytics.js (trackEvent), share.js (setupShareButton)
 */

// ---- Constants ---------------------------------------------------------------

var TIMER_SECONDS = 180; // 3 minutes
var TLQ_URL = 'https://thelastquestion.io';
var TLQ_UTM = '?utm_source=puzzle&utm_medium=sidegame&utm_campaign=deduction';

// ---- State -------------------------------------------------------------------

var state = {
  currentCase:     null,
  selectedSuspect: null,
  timeRemaining:   TIMER_SECONDS,
  timerInterval:   null,
  hintUsed:        false,
  sessionId:       null,
  practiceMode:    false,
  hardcoreMode:    false,
};

// ---- Init --------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  state.sessionId    = getOrCreateSessionId();
  state.practiceMode = new URLSearchParams(window.location.search).get('practice') === '1';
  state.hardcoreMode = new URLSearchParams(window.location.search).get('hardcore') === '1';

  if (state.hardcoreMode) {
    TIMER_SECONDS = 90;
    state.timeRemaining = 90;
  }

  if (typeof updateHeaderRankBadge === 'function') updateHeaderRankBadge();
  if (typeof setupRankModal === 'function') setupRankModal();
  if (typeof setupAudioToggle === 'function') setupAudioToggle();

  loadCase().then(function (caseData) {
    if (!caseData) {
      showScreen('screen-error');
      return;
    }

    state.currentCase = caseData;
    renderCase(caseData);
    showScreen('screen-game');

    if (state.practiceMode) {
      // Hide the timer and disable countdown in practice mode
      document.getElementById('timer').style.display = 'none';
    } else {
      startTimer();
    }

    trackEvent('case_viewed', { case_id: caseData.id, practice: state.practiceMode });
  });
});

// ---- Session ID --------------------------------------------------------------

function getOrCreateSessionId() {
  var sid = localStorage.getItem('dp_sid');
  if (!sid) {
    sid = generateId();
    localStorage.setItem('dp_sid', sid);
  }
  return sid;
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ---- Case loading ------------------------------------------------------------

function loadCase() {
  var params = new URLSearchParams(window.location.search);
  var specificId = params.get('id');

  if (specificId) {
    return loadCaseById(specificId);
  }
  return loadTodayCase();
}

function loadTodayCase() {
  return fetch('/api/case-today')
    .then(function (res) {
      if (res.ok) return res.json();
      throw new Error('API error');
    })
    .catch(function () {
      return loadFromStaticJson(null);
    });
}

function loadCaseById(id) {
  return fetch('/api/case-by-id?id=' + encodeURIComponent(id))
    .then(function (res) {
      if (res.ok) return res.json();
      throw new Error('API error');
    })
    .catch(function () {
      return loadFromStaticJson(id);
    });
}

function loadFromStaticJson(id) {
  return fetch('/data/cases.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (id) {
        return data.cases.find(function (c) { return c.id === id; }) || null;
      }

      var today = todayDateString();
      var caseId = data.schedule[today];

      if (!caseId) {
        var sorted = Object.keys(data.schedule).sort().reverse();
        caseId = data.schedule[sorted[0]];
      }

      return data.cases.find(function (c) { return c.id === caseId; }) || data.cases[0] || null;
    })
    .catch(function () { return null; });
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// ---- Render case -------------------------------------------------------------

function renderCase(caseData) {
  document.getElementById('case-title').textContent = caseData.title;
  document.getElementById('case-intro').textContent = caseData.intro;
  document.getElementById('case-id-badge').textContent = caseData.id.toUpperCase();
  document.getElementById('tlq-link').href = TLQ_URL + TLQ_UTM;

  var arcBadge = document.getElementById('arc-badge');
  if (arcBadge && caseData.arc) {
    arcBadge.textContent = caseData.arc;
    arcBadge.classList.remove('hidden');
  } else if (arcBadge) {
    arcBadge.classList.add('hidden');
  }

  renderSuspects(caseData.suspects);
  renderClues(caseData.clues);

  if (caseData.hint && !state.hardcoreMode) {
    document.getElementById('hint-area').classList.remove('hidden');
  }

  if (state.practiceMode) {
    document.getElementById('case-id-badge').textContent += ' (Practice)';
  } else if (state.hardcoreMode) {
    document.getElementById('case-id-badge').textContent += ' (💀 Hardcore)';
  }
}

function renderSuspects(suspects) {
  var grid = document.getElementById('suspects-grid');
  grid.innerHTML = '';

  suspects.forEach(function (suspect) {
    var card = document.createElement('div');
    card.className = 'suspect-card';
    card.dataset.name = suspect.name;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');

    card.innerHTML =
      '<div class="suspect-avatar" aria-hidden="true">' + escapeHtml(suspect.name.charAt(0)) + '</div>' +
      '<div class="suspect-info">' +
        '<div class="suspect-header-row">' +
          '<span class="suspect-name">' + escapeHtml(suspect.name) + '</span>' +
          '<button class="eliminate-btn" type="button" title="Toggle elimination">✕ Eliminate</button>' +
        '</div>' +
        '<span class="suspect-desc">' + escapeHtml(suspect.description) + '</span>' +
      '</div>';

    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('eliminate-btn') || e.target.closest('.eliminate-btn')) {
        e.stopPropagation();
        toggleEliminated(card);
        return;
      }
      selectSuspect(suspect.name);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSuspect(suspect.name);
      }
    });

    grid.appendChild(card);
  });
}

function toggleEliminated(card) {
  var isEliminated = card.classList.toggle('eliminated');
  if (isEliminated) {
    if (typeof playEliminateSound === 'function') playEliminateSound();
  } else {
    if (typeof playRestoreSound === 'function') playRestoreSound();
  }
  var btn = card.querySelector('.eliminate-btn');
  if (btn) {
    btn.textContent = isEliminated ? '↺ Restore' : '✕ Eliminate';
    btn.classList.toggle('active', isEliminated);
  }
  if (isEliminated && card.classList.contains('selected')) {
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
    state.selectedSuspect = null;
    document.getElementById('selected-label').textContent = 'Select a suspect above';
    document.getElementById('accuse-btn').disabled = true;
  }
}

function renderClues(clues) {
  var list = document.getElementById('clues-list');
  list.innerHTML = '';
  var suspects = (state.currentCase && state.currentCase.suspects) || [];

  clues.forEach(function (clue, idx) {
    var li = document.createElement('li');
    li.className = 'clue-item interactive-clue';
    li.setAttribute('role', 'region');
    li.setAttribute('aria-label', 'Evidence piece ' + (idx + 1));

    var optionsHtml = '<option value="">📌 Link Evidence...</option>' +
                      '<option value="motive">⚡ Motive Confirmed</option>' +
                      '<option value="alibi">🛡️ Alibi Verified</option>' +
                      '<option value="lie">🚨 Contradiction Found</option>';

    suspects.forEach(function (s) {
      optionsHtml += '<option value="' + escapeHtml(s.name) + '">👤 Implicates ' + escapeHtml(s.name) + '</option>';
    });

    li.innerHTML =
      '<div class="clue-main-content">' +
        '<span class="clue-text">' + escapeHtml(clue) + '</span>' +
      '</div>' +
      '<div class="clue-actions-row">' +
        '<select class="clue-tag-select" aria-label="Tag evidence with analysis">' + optionsHtml + '</select>' +
        '<button class="clue-verify-btn" type="button" title="Mark as verified">✓ Verify</button>' +
      '</div>';

    var selectEl = li.querySelector('.clue-tag-select');
    selectEl.addEventListener('change', function (e) {
      e.stopPropagation();
      li.classList.remove('tag-motive', 'tag-alibi', 'tag-lie', 'tag-suspect');
      var val = selectEl.value;
      if (val === 'motive') li.classList.add('tag-motive');
      else if (val === 'alibi') li.classList.add('tag-alibi');
      else if (val === 'lie') li.classList.add('tag-lie');
      else if (val !== '') li.classList.add('tag-suspect');

      if (typeof playClickSound === 'function') playClickSound();
    });

    var verifyBtn = li.querySelector('.clue-verify-btn');
    verifyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      li.classList.toggle('highlighted-clue');
      var verified = li.classList.contains('highlighted-clue');
      verifyBtn.textContent = verified ? '✓ Verified' : '✓ Verify';
      verifyBtn.classList.toggle('active', verified);
      if (typeof playClickSound === 'function') playClickSound();
    });

    list.appendChild(li);
  });
}


// ---- Suspect selection -------------------------------------------------------

function selectSuspect(name) {
  state.selectedSuspect = name;

  document.querySelectorAll('.suspect-card').forEach(function (card) {
    var isSelected = card.dataset.name === name;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });

  document.getElementById('selected-label').textContent = 'Accusing: ' + name;
  document.getElementById('accuse-btn').disabled = false;
}

// ---- Timer -------------------------------------------------------------------

function startTimer() {
  updateTimerDisplay(state.timeRemaining);
  state.timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  state.timeRemaining -= 1;
  updateTimerDisplay(state.timeRemaining);

  if (state.timeRemaining <= 0) {
    clearInterval(state.timerInterval);
    onTimeUp();
  }
}

function updateTimerDisplay(seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  var el = document.getElementById('timer');
  el.textContent = mins + ':' + String(secs).padStart(2, '0');

  el.classList.remove('timer-green', 'timer-yellow', 'timer-red', 'timer-pulse');

  if (seconds > 60) {
    el.classList.add('timer-green');
  } else if (seconds > 15) {
    el.classList.add('timer-yellow');
  } else {
    el.classList.add('timer-red', 'timer-pulse');
    if (seconds <= 15 && seconds > 0) {
      if (typeof playTickSound === 'function') playTickSound();
    }
  }
}

function onTimeUp() {
  trackEvent('time_expired', { case_id: state.currentCase.id });
  showResultScreen(false, 0, true);
}

// ---- Accusation flow ---------------------------------------------------------

document.getElementById('accuse-btn').addEventListener('click', function () {
  if (!state.selectedSuspect) return;
  document.getElementById('confirm-name').textContent = state.selectedSuspect;
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-btn').focus();
});

document.getElementById('cancel-btn').addEventListener('click', closeModal);

document.getElementById('modal-backdrop').addEventListener('click', closeModal);

document.getElementById('confirm-btn').addEventListener('click', function () {
  closeModal();
  submitAccusation();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
}

function submitAccusation() {
  clearInterval(state.timerInterval);

  var correct = state.selectedSuspect === state.currentCase.solution;
  var timeTaken = TIMER_SECONDS - state.timeRemaining;

  trackEvent('accusation_made', {
    case_id:   state.currentCase.id,
    suspect:   state.selectedSuspect,
    correct:   correct,
    time_taken: timeTaken,
  });

  logAttempt({
    case_id:         state.currentCase.id,
    session_id:      state.sessionId,
    correct:         correct,
    time_taken:      timeTaken,
    guessed_suspect: state.selectedSuspect,
  });

  showResultScreen(correct, state.timeRemaining, false);
}

// ---- Result screen -----------------------------------------------------------

function showResultScreen(correct, timeRemaining, timedOut) {
  updateStreak(correct);
  if (typeof recordGameResult === 'function') {
    recordGameResult({
      correct: correct,
      timeTaken: TIMER_SECONDS - timeRemaining,
      hintUsed: state.hintUsed,
      hardcore: state.hardcoreMode || false
    });
  }

  var header  = document.getElementById('result-header');
  var icon    = document.getElementById('result-icon');
  var verdict = document.getElementById('result-verdict');
  var timeEl  = document.getElementById('result-time');

  header.className = 'result-header ' + (correct ? 'correct' : 'wrong');

  if (timedOut) {
    if (typeof playFailSound === 'function') playFailSound();
    icon.textContent    = 'X';
    verdict.textContent = 'Out of time';
    timeEl.textContent  = 'The clock ran out before you made a call.';
  } else if (correct) {
    if (typeof playSolveSound === 'function') playSolveSound();
    icon.textContent    = 'V';
    verdict.textContent = 'Case closed';
    timeEl.textContent  = timeRemaining + 's remaining on the clock';
  } else {
    if (typeof playFailSound === 'function') playFailSound();
    icon.textContent    = 'X';
    verdict.textContent = 'Wrong suspect';
    timeEl.textContent  = timeRemaining + 's were left when you made your call';
  }

  document.getElementById('result-solution').textContent    = state.currentCase.solution;
  document.getElementById('result-explanation').textContent = state.currentCase.explanation;

  var clueCount = state.currentCase.clues.length;
  var timeTaken = TIMER_SECONDS - timeRemaining;

  var statsBox = document.getElementById('community-stats');
  var statsContent = document.getElementById('stats-content');
  if (statsBox && statsContent) {
    var caseIdNum = parseInt(state.currentCase.id.replace(/[^0-9]/g, '') || '1', 10);
    var baseSpeedPercentile = Math.min(96, Math.max(54, Math.floor(65 + ((TIMER_SECONDS - timeTaken) * 0.25) + (caseIdNum % 11))));
    var baseHintlessPercent = 32 + (caseIdNum % 19);

    if (correct) {
      statsContent.textContent = 'You solved this faster than ' + baseSpeedPercentile + '% of detectives today. Only ' + baseHintlessPercent + '% cracked this case on their first try without hints.';
    } else {
      var fellForAlibi = 48 + (caseIdNum % 23);
      statsContent.textContent = 'This was a tricky case. Around ' + fellForAlibi + '% of detectives fell for the false alibi on their first try today.';
    }
    statsBox.classList.remove('hidden');
  }

  var streak = getStreak();
  if (streak >= 2) {
    var banner = document.getElementById('streak-banner');
    banner.textContent = streak + '-case streak';
    banner.classList.remove('hidden');
  }

  var achievementBanner = document.getElementById('achievement-banner');
  if (achievementBanner && (correct || streak >= 2)) {
    achievementBanner.classList.remove('hidden');
  } else if (achievementBanner) {
    achievementBanner.classList.add('hidden');
  }

  var epilogueEl = document.getElementById('epilogue-text');
  if (epilogueEl) {
    if (state.currentCase.epilogue) {
      epilogueEl.textContent = state.currentCase.epilogue;
      epilogueEl.classList.remove('hidden');
    } else {
      epilogueEl.classList.add('hidden');
    }
  }

  var bridgeEl = document.getElementById('bridge-text');
  if (bridgeEl) {
    if (correct && timeTaken < 60 && !state.hintUsed) {
      bridgeEl.textContent = 'Masterful deduction. You dismantled their story from static evidence in just ' + timeTaken + 's. Can you crack a live suspect under real-time interrogation?';
    } else if (correct && state.hintUsed) {
      bridgeEl.textContent = 'You spotted the contradiction with some guidance. In live operations, there are no hints. Test your skills in a real cross-examination.';
    } else if (correct) {
      bridgeEl.textContent = 'You closed the static case in ' + timeTaken + 's with ' + clueCount + ' pieces of evidence. Step up from reading written reports to live interrogations.';
    } else {
      bridgeEl.textContent = 'Static reports missed the real lie this time. What if you could enter the interrogation room and press the suspect on their contradictions yourself?';
    }
  }

  setupShareButton(correct, timeRemaining, timeTaken);
  setupTranscriptModal();
  trackEvent('result_seen', { case_id: state.currentCase.id, correct: correct });
  showScreen('screen-result');
}

// ---- Streak ------------------------------------------------------------------

function getStreak() {
  try {
    return JSON.parse(localStorage.getItem('dp_streak') || '{}').count || 0;
  } catch (_) {
    return 0;
  }
}

function updateStreak(correct) {
  try {
    var data  = JSON.parse(localStorage.getItem('dp_streak') || '{}');
    var today = todayDateString();

    if (!correct) {
      data.count = 0;
    } else if (data.last_date === today) {
      // Already recorded a win today; do not double count
    } else {
      data.count     = (data.count || 0) + 1;
      data.last_date = today;
    }

    localStorage.setItem('dp_streak', JSON.stringify(data));
  } catch (_) {
    // localStorage unavailable in some private-mode browsers
  }
}

// ---- Hint system -------------------------------------------------------------

document.getElementById('hint-btn').addEventListener('click', function () {
  if (state.hintUsed || !state.currentCase || !state.currentCase.hint) return;

  state.hintUsed        = true;
  state.timeRemaining   = Math.max(0, state.timeRemaining - 30);
  updateTimerDisplay(state.timeRemaining);

  var hintText = document.getElementById('hint-text');
  hintText.textContent = state.currentCase.hint;
  hintText.classList.remove('hidden');

  var hintBtn = document.getElementById('hint-btn');
  hintBtn.disabled    = true;
  hintBtn.textContent = 'Hint used';

  trackEvent('hint_used', { case_id: state.currentCase.id });
});

// ---- Utilities ---------------------------------------------------------------

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function logAttempt(payload) {
  fetch('/api/log-attempt', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  }).catch(function () {
    // Non-critical; ignore network failures
  });
}

// ---- Intercepted Transcript Modal -------------------------------------------

function setupTranscriptModal() {
  var link = document.getElementById('tlq-link');
  var modal = document.getElementById('transcript-modal');
  var cancelBtn = document.getElementById('transcript-cancel-btn');
  var backdrop = document.getElementById('transcript-backdrop');

  if (link && modal && !link.dataset.modalBound) {
    link.dataset.modalBound = '1';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      modal.classList.remove('hidden');
      if (typeof playClickSound === 'function') playClickSound();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
    }
  }
}

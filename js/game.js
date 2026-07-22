/*
 * game.js
 * Core game logic: case loading, timer, suspect selection,
 * accusation flow, result display, streak tracking, and hint system.
 *
 * Depends on: analytics.js (trackEvent), share.js (setupShareButton)
 */

// ---- Constants ---------------------------------------------------------------

var TIMER_SECONDS = 180; // 3 minutes
var TLQ_URL = 'https://thelastquestion.com'; // placeholder until real URL is provided

// ---- State -------------------------------------------------------------------

var state = {
  currentCase:     null,
  selectedSuspect: null,
  timeRemaining:   TIMER_SECONDS,
  timerInterval:   null,
  hintUsed:        false,
  sessionId:       null,
};

// ---- Init --------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  state.sessionId = getOrCreateSessionId();

  loadCase().then(function (caseData) {
    if (!caseData) {
      showScreen('screen-error');
      return;
    }

    state.currentCase = caseData;
    renderCase(caseData);
    showScreen('screen-game');
    startTimer();
    trackEvent('case_viewed', { case_id: caseData.id });
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
  document.getElementById('tlq-link').href = TLQ_URL;

  renderSuspects(caseData.suspects);
  renderClues(caseData.clues);

  if (caseData.hint) {
    document.getElementById('hint-area').classList.remove('hidden');
  }
}

function renderSuspects(suspects) {
  var grid = document.getElementById('suspects-grid');
  grid.innerHTML = '';

  suspects.forEach(function (suspect) {
    var btn = document.createElement('button');
    btn.className = 'suspect-card';
    btn.dataset.name = suspect.name;
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML =
      '<div class="suspect-avatar" aria-hidden="true">' + escapeHtml(suspect.name.charAt(0)) + '</div>' +
      '<div class="suspect-info">' +
        '<span class="suspect-name">' + escapeHtml(suspect.name) + '</span>' +
        '<span class="suspect-desc">' + escapeHtml(suspect.description) + '</span>' +
      '</div>';
    btn.addEventListener('click', function () { selectSuspect(suspect.name); });
    grid.appendChild(btn);
  });
}

function renderClues(clues) {
  var list = document.getElementById('clues-list');
  list.innerHTML = '';
  clues.forEach(function (clue) {
    var li = document.createElement('li');
    li.className = 'clue-item';
    li.textContent = clue;
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

  var header  = document.getElementById('result-header');
  var icon    = document.getElementById('result-icon');
  var verdict = document.getElementById('result-verdict');
  var timeEl  = document.getElementById('result-time');

  header.className = 'result-header ' + (correct ? 'correct' : 'wrong');

  if (timedOut) {
    icon.textContent    = 'X';
    verdict.textContent = 'Out of time';
    timeEl.textContent  = 'The clock ran out before you made a call.';
  } else if (correct) {
    icon.textContent    = 'V';
    verdict.textContent = 'Case closed';
    timeEl.textContent  = timeRemaining + 's remaining on the clock';
  } else {
    icon.textContent    = 'X';
    verdict.textContent = 'Wrong suspect';
    timeEl.textContent  = timeRemaining + 's were left when you made your call';
  }

  document.getElementById('result-solution').textContent    = state.currentCase.solution;
  document.getElementById('result-explanation').textContent = state.currentCase.explanation;

  var clueCount = state.currentCase.clues.length;
  var timeTaken = TIMER_SECONDS - timeRemaining;
  document.getElementById('bridge-text').textContent =
    'You had ' + clueCount + ' clues and ' + timeTaken + ' seconds. What if you could interrogate the suspect yourself?';

  var streak = getStreak();
  if (streak >= 2) {
    var banner = document.getElementById('streak-banner');
    banner.textContent = streak + '-case streak';
    banner.classList.remove('hidden');
  }

  setupShareButton(correct, timeRemaining, timeTaken);
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

/*
 * rank.js
 * Manages persistent player statistics, detective rank progression, and profile scorecard modal display.
 */

var RANKS = [
  { threshold: 0,  title: 'Cadet',             icon: '🔍', level: 1, next: 1 },
  { threshold: 1,  title: 'Field Analyst',     icon: '📊', level: 2, next: 3 },
  { threshold: 3,  title: 'Lead Interrogator', icon: '🕵️', level: 3, next: 7 },
  { threshold: 7,  title: 'Special Agent',     icon: '🕶️', level: 4, next: 15 },
  { threshold: 15, title: 'Master Detective',  icon: '🏆', level: 5, next: 999 }
];

function getPlayerStats() {
  try {
    var raw = localStorage.getItem('dp_player_stats');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {
    // LocalStorage unavailable
  }
  return {
    totalPlayed: 0,
    totalSolved: 0,
    cleanSolves: 0,
    hardcoreSolves: 0,
    fastestTime: null
  };
}

function savePlayerStats(stats) {
  try {
    localStorage.setItem('dp_player_stats', JSON.stringify(stats));
  } catch (_) {
    // Ignore error
  }
}

function recordGameResult(result) {
  var stats = getPlayerStats();
  stats.totalPlayed += 1;

  if (result.correct) {
    stats.totalSolved += 1;
    if (!result.hintUsed) {
      stats.cleanSolves += 1;
    }
    if (result.hardcore) {
      stats.hardcoreSolves = (stats.hardcoreSolves || 0) + 1;
      // Award extra credit for solving in hardcore mode
      stats.totalSolved += 1;
    }
    if (stats.fastestTime === null || result.timeTaken < stats.fastestTime) {
      stats.fastestTime = result.timeTaken;
    }
  }

  savePlayerStats(stats);
  updateHeaderRankBadge();
}

function getPlayerRank() {
  var stats = getPlayerStats();
  var currentRank = RANKS[0];
  for (var i = 0; i < RANKS.length; i++) {
    if (stats.totalSolved >= RANKS[i].threshold) {
      currentRank = RANKS[i];
    }
  }
  return currentRank;
}

function updateHeaderRankBadge() {
  var badge = document.getElementById('header-rank-badge');
  if (!badge) return;

  var rank = getPlayerRank();
  badge.innerHTML = '<span>' + rank.icon + ' ' + escapeHtml(rank.title) + '</span>';
}

function setupRankModal() {
  var badge = document.getElementById('header-rank-badge');
  var modal = document.getElementById('profile-modal');
  var closeBtn = document.getElementById('profile-close-btn');
  var backdrop = document.getElementById('profile-backdrop');

  if (!badge || !modal) return;

  badge.addEventListener('click', function () {
    renderScorecardContent();
    modal.classList.remove('hidden');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', function () {
      modal.classList.add('hidden');
    });
  }
}

function renderScorecardContent() {
  var stats = getPlayerStats();
  var rank = getPlayerRank();

  var titleEl = document.getElementById('profile-rank-title');
  var iconEl  = document.getElementById('profile-rank-icon');
  var progressTextEl = document.getElementById('profile-progress-text');
  var progressBarEl = document.getElementById('profile-progress-bar');
  
  if (titleEl) titleEl.textContent = rank.title;
  if (iconEl) iconEl.textContent = rank.icon;

  var nextTarget = rank.next;
  if (nextTarget >= 999) {
    if (progressTextEl) progressTextEl.textContent = 'Maximum Rank Achieved (' + stats.totalSolved + ' Solved)';
    if (progressBarEl) progressBarEl.style.width = '100%';
  } else {
    var progressPct = Math.min(100, Math.floor((stats.totalSolved / nextTarget) * 100));
    if (progressTextEl) progressTextEl.textContent = stats.totalSolved + ' / ' + nextTarget + ' Solved for Next Rank';
    if (progressBarEl) progressBarEl.style.width = progressPct + '%';
  }

  var playedEl = document.getElementById('stat-played');
  var solvedEl = document.getElementById('stat-solved');
  var cleanEl  = document.getElementById('stat-clean');
  var fastestEl = document.getElementById('stat-fastest');

  if (playedEl) playedEl.textContent = String(stats.totalPlayed);
  if (solvedEl) solvedEl.textContent = String(stats.totalSolved);
  if (cleanEl)  cleanEl.textContent  = String(stats.cleanSolves);
  if (fastestEl) {
    fastestEl.textContent = stats.fastestTime ? (stats.fastestTime + 's') : 'N/A';
  }
}

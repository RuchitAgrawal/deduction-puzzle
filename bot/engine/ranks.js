/*
 * engine/ranks.js
 * Server-side port of js/rank.js with all DOM dependencies removed.
 * Shared by both Telegram and Discord bots.
 */

const RANKS = [
  { threshold: 0,  title: 'Cadet',             icon: 'I',   tier: 'Tier I',   level: 1, next: 1   },
  { threshold: 1,  title: 'Field Analyst',     icon: 'II',  tier: 'Tier II',  level: 2, next: 3   },
  { threshold: 3,  title: 'Lead Interrogator', icon: 'III', tier: 'Tier III', level: 3, next: 7   },
  { threshold: 7,  title: 'Special Agent',     icon: 'IV',  tier: 'Tier IV',  level: 4, next: 15  },
  { threshold: 15, title: 'Master Detective',  icon: 'V',   tier: 'Tier V',   level: 5, next: 999 }
];

function getRankForStats(stats) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if ((stats.total_solved || stats.totalSolved || 0) >= r.threshold) {
      rank = r;
    }
  }
  return rank;
}

function getProgressText(stats) {
  const rank   = getRankForStats(stats);
  const solved = stats.total_solved || stats.totalSolved || 0;

  if (rank.next >= 999) {
    return `Maximum rank achieved (${solved} solved)`;
  }
  return `${solved} / ${rank.next} solved for next rank`;
}

function getRankLabel(stats) {
  const rank = getRankForStats(stats);
  return `${rank.tier} \u2022 ${rank.title}`;
}

module.exports = { RANKS, getRankForStats, getProgressText, getRankLabel };

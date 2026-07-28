/*
 * storage/db.js
 * SQLite wrapper using better-sqlite3 for persistent player stats, leaderboards, and session storage.
 */

const fs   = require('fs');
const path = require('path');

let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // If better-sqlite3 isn't installed yet, provide stub fallback during early dev/syntax check
  Database = null;
}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/players.db');

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;
  if (!Database) {
    throw new Error('better-sqlite3 is required for database persistence. Please run npm install.');
  }

  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new Database(DB_PATH);
  
  // Initialize schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.exec(schema);
  }

  return dbInstance;
}

function getOrCreatePlayer(userId, platform, username = null) {
  const db = getDb();
  let player = db.prepare('SELECT * FROM players WHERE id = ?').get(userId);

  if (!player) {
    db.prepare('INSERT INTO players (id, platform, username) VALUES (?, ?, ?)')
      .run(userId, platform, username || userId);
    player = db.prepare('SELECT * FROM players WHERE id = ?').get(userId);
  } else if (username && player.username !== username) {
    db.prepare('UPDATE players SET username = ? WHERE id = ?').run(username, userId);
    player.username = username;
  }

  return player;
}

function getPlayerStats(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM players WHERE id = ?').get(userId) || {
    id: userId,
    total_played: 0,
    total_solved: 0,
    clean_solves: 0,
    hardcore_solves: 0,
    fastest_time: null,
    streak: 0
  };
}

function updatePlayerStats(userId, platform, result, username = null) {
  const db = getDb();
  const player = getOrCreatePlayer(userId, platform, username);
  
  let totalPlayed   = (player.total_played || 0) + 1;
  let totalSolved   = player.total_solved || 0;
  let cleanSolves   = player.clean_solves || 0;
  let hardcoreSolves = player.hardcore_solves || 0;
  let fastestTime   = player.fastest_time;
  let streak        = player.streak || 0;

  if (result.correct) {
    totalSolved += 1;
    streak += 1;
    if (!result.hintUsed) {
      cleanSolves += 1;
    }
    if (result.hardcore) {
      hardcoreSolves += 1;
      totalSolved += 1; // Extra credit for hardcore
    }
    if (fastestTime === null || fastestTime === undefined || result.timeTaken < fastestTime) {
      fastestTime = result.timeTaken;
    }
  } else {
    streak = 0;
  }

  db.prepare(`
    UPDATE players SET 
      total_played = ?, 
      total_solved = ?, 
      clean_solves = ?, 
      hardcore_solves = ?, 
      fastest_time = ?, 
      streak = ?
    WHERE id = ?
  `).run(totalPlayed, totalSolved, cleanSolves, hardcoreSolves, fastestTime, streak, userId);

  return getPlayerStats(userId);
}

function logResult(userId, caseId, correct, timeTaken, hintUsed) {
  const db = getDb();
  db.prepare('INSERT INTO results (user_id, case_id, correct, time_taken, hint_used) VALUES (?, ?, ?, ?, ?)')
    .run(userId, caseId, correct ? 1 : 0, timeTaken || 0, hintUsed ? 1 : 0);
}

function getLeaderboard(limit = 10, platform = null) {
  const db = getDb();
  if (platform) {
    return db.prepare('SELECT * FROM players WHERE platform = ? ORDER BY total_solved DESC, streak DESC LIMIT ?').all(platform, limit);
  }
  return db.prepare('SELECT * FROM players ORDER BY total_solved DESC, streak DESC LIMIT ?').all(limit);
}

// Session persistence backup
function saveSessionDb(session) {
  const db = getDb();
  db.prepare(`
    INSERT INTO sessions (user_id, case_id, started_at, hint_used, platform)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      case_id = excluded.case_id,
      started_at = excluded.started_at,
      hint_used = excluded.hint_used,
      platform = excluded.platform
  `).run(session.userId, session.caseId, session.startedAt, session.hintUsed ? 1 : 0, session.platform);
}

function getSessionDb(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE user_id = ?').get(userId) || null;
}

function removeSessionDb(userId) {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

module.exports = {
  getDb,
  getOrCreatePlayer,
  getPlayerStats,
  updatePlayerStats,
  logResult,
  getLeaderboard,
  saveSessionDb,
  getSessionDb,
  removeSessionDb
};

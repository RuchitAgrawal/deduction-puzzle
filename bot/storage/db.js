/*
 * storage/db.js
 * SQLite wrapper using Node 22+ built-in node:sqlite (no native compilation required).
 * Falls back to a no-op in-memory stub if the module is unavailable.
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH   = process.env.DB_PATH || path.join(__dirname, '../data/players.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let DatabaseSync;
let useBuiltin = false;

try {
  const nodeSqlite = require('node:sqlite');
  DatabaseSync = nodeSqlite.DatabaseSync;
  useBuiltin   = true;
} catch (e) {
  console.warn('[db] node:sqlite not available (requires Node 22+). Stats will not be persisted.');
}

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;
  if (!useBuiltin) return null;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(DB_PATH);

  // Initialize schema
  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    dbInstance.exec(schema);
  }

  return dbInstance;
}

// Helper that converts node:sqlite prepare().all()/get()/run() interface
function q(sql) {
  const db = getDb();
  if (!db) return null;
  return db.prepare(sql);
}

function getOrCreatePlayer(userId, platform, username = null) {
  const db = getDb();
  if (!db) {
    return { id: userId, platform, username, total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0 };
  }

  let player = db.prepare('SELECT * FROM players WHERE id = ?').get(userId);
  if (!player) {
    db.prepare('INSERT INTO players (id, platform, username) VALUES (?, ?, ?)').run(userId, platform, username || userId);
    player = db.prepare('SELECT * FROM players WHERE id = ?').get(userId);
  } else if (username && player.username !== username) {
    db.prepare('UPDATE players SET username = ? WHERE id = ?').run(username, userId);
    player.username = username;
  }

  return player;
}

function getPlayerStats(userId) {
  const db = getDb();
  if (!db) return { id: userId, total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0 };
  return db.prepare('SELECT * FROM players WHERE id = ?').get(userId) || {
    id: userId, total_played: 0, total_solved: 0, clean_solves: 0, hardcore_solves: 0, fastest_time: null, streak: 0
  };
}

function updatePlayerStats(userId, platform, result, username = null) {
  const db = getDb();
  const player = getOrCreatePlayer(userId, platform, username);

  let totalPlayed    = (player.total_played   || 0) + 1;
  let totalSolved    = player.total_solved    || 0;
  let cleanSolves    = player.clean_solves    || 0;
  let hardcoreSolves = player.hardcore_solves || 0;
  let fastestTime    = player.fastest_time;
  let streak         = player.streak || 0;

  if (result.correct) {
    totalSolved += 1;
    streak      += 1;
    if (!result.hintUsed) cleanSolves += 1;
    if (result.hardcore)  hardcoreSolves += 1;
    if (fastestTime === null || fastestTime === undefined || result.timeTaken < fastestTime) {
      fastestTime = result.timeTaken;
    }
  } else {
    streak = 0;
  }

  if (db) {
    db.prepare(`
      UPDATE players SET
        total_played = ?, total_solved = ?, clean_solves = ?,
        hardcore_solves = ?, fastest_time = ?, streak = ?
      WHERE id = ?
    `).run(totalPlayed, totalSolved, cleanSolves, hardcoreSolves, fastestTime, streak, userId);
  }

  return getPlayerStats(userId);
}

function logResult(userId, caseId, correct, timeTaken, hintUsed) {
  const db = getDb();
  if (!db) return;
  db.prepare('INSERT INTO results (user_id, case_id, correct, time_taken, hint_used) VALUES (?, ?, ?, ?, ?)')
    .run(userId, caseId, correct ? 1 : 0, timeTaken || 0, hintUsed ? 1 : 0);
}

function getLeaderboard(limit = 10, platform = null) {
  const db = getDb();
  if (!db) return [];
  if (platform) {
    return db.prepare('SELECT * FROM players WHERE platform = ? ORDER BY total_solved DESC, streak DESC LIMIT ?').all(platform, limit);
  }
  return db.prepare('SELECT * FROM players ORDER BY total_solved DESC, streak DESC LIMIT ?').all(limit);
}

// Session backup to DB (so sessions survive restarts)
function saveSessionDb(session) {
  const db = getDb();
  if (!db) return;
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
  if (!db) return null;
  return db.prepare('SELECT * FROM sessions WHERE user_id = ?').get(userId) || null;
}

function removeSessionDb(userId) {
  const db = getDb();
  if (!db) return;
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

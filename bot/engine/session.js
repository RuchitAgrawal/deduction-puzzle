/*
 * engine/session.js
 * In-memory game session management with database backup.
 * Coordinates starting investigations, using hints, and checking suspect accusations.
 */

const cases = require('./cases');
let db;
try {
  db = require('../storage/db');
} catch (_) {
  db = null;
}

// In-memory sessions: userId -> session object
const sessions = new Map();

function createSession(userId, platform, caseId = null) {
  let caseData;
  if (caseId) {
    caseData = cases.getCaseById(caseId);
  } else {
    caseData = cases.getCaseForToday();
  }

  if (!caseData) {
    throw new Error('Case not found');
  }

  const session = {
    userId: String(userId),
    platform: platform,
    caseId: caseData.id,
    caseData: caseData,
    startedAt: Date.now(),
    hintUsed: false
  };

  sessions.set(session.userId, session);

  if (db) {
    try {
      db.saveSessionDb(session);
    } catch (_) {
      // DB persistence fallback if DB not ready
    }
  }

  return session;
}

function getSession(userId) {
  const strId = String(userId);
  if (sessions.has(strId)) {
    return sessions.get(strId);
  }

  if (db) {
    try {
      const row = db.getSessionDb(strId);
      if (row) {
        const caseData = cases.getCaseById(row.case_id);
        if (caseData) {
          const session = {
            userId: strId,
            platform: row.platform,
            caseId: row.case_id,
            caseData: caseData,
            startedAt: row.started_at,
            hintUsed: Boolean(row.hint_used)
          };
          sessions.set(strId, session);
          return session;
        }
      }
    } catch (_) {
      // Ignore DB read errors
    }
  }

  return null;
}

function useHint(userId) {
  const session = getSession(userId);
  if (!session) return null;

  session.hintUsed = true;
  sessions.set(String(userId), session);

  if (db) {
    try {
      db.saveSessionDb(session);
    } catch (_) {
      // Ignore
    }
  }

  return session.caseData.hint || 'No additional clues available for this case.';
}

function resolveAccusation(userId, suspectName) {
  const session = getSession(userId);
  if (!session) {
    return { error: 'No active investigation session found.' };
  }

  const caseData  = session.caseData;
  const timeTaken = Math.max(1, Math.floor((Date.now() - session.startedAt) / 1000));
  const correct   = (caseData.solution === suspectName);

  const result = {
    correct: correct,
    timeTaken: timeTaken,
    hintUsed: session.hintUsed,
    suspectName: suspectName,
    solution: caseData.solution,
    explanation: caseData.explanation,
    epilogue: caseData.epilogue,
    caseTitle: caseData.title,
    caseId: caseData.id
  };

  // Clean up session after resolving
  clearSession(userId);

  return result;
}

function clearSession(userId) {
  const strId = String(userId);
  sessions.delete(strId);

  if (db) {
    try {
      db.removeSessionDb(strId);
    } catch (_) {
      // Ignore
    }
  }
}

module.exports = {
  createSession,
  getSession,
  useHint,
  resolveAccusation,
  clearSession
};

CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,
  platform        TEXT NOT NULL,
  username        TEXT,
  total_played    INTEGER DEFAULT 0,
  total_solved    INTEGER DEFAULT 0,
  clean_solves    INTEGER DEFAULT 0,
  hardcore_solves INTEGER DEFAULT 0,
  fastest_time    INTEGER,
  streak          INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  user_id         TEXT PRIMARY KEY,
  case_id         TEXT NOT NULL,
  started_at      INTEGER NOT NULL,
  hint_used       INTEGER DEFAULT 0,
  platform        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL,
  case_id         TEXT NOT NULL,
  correct         INTEGER NOT NULL,
  time_taken      INTEGER,
  hint_used       INTEGER,
  played_at       TEXT DEFAULT (datetime('now'))
);

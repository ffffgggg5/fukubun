import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "fukubun.db");

declare global {
  var __fukubunDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sentence_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      english TEXT NOT NULL,
      japanese TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memo_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_type TEXT NOT NULL CHECK (card_type IN ('sentence', 'memo')),
      card_id INTEGER NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      last_reviewed_at TEXT,
      is_new INTEGER NOT NULL DEFAULT 1,
      queued_date TEXT,
      UNIQUE (card_type, card_id)
    );

    CREATE INDEX IF NOT EXISTS idx_review_state_due
      ON review_state (is_new, due_date);

    CREATE TABLE IF NOT EXISTS review_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_type TEXT NOT NULL CHECK (card_type IN ('sentence', 'memo')),
      card_id INTEGER NOT NULL,
      phase TEXT NOT NULL CHECK (phase IN ('en2ja', 'ja2en', 'memo')),
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_review_log_card
      ON review_log (card_type, card_id, reviewed_at);

    CREATE TABLE IF NOT EXISTS daily_progress (
      date TEXT PRIMARY KEY,
      completed INTEGER NOT NULL DEFAULT 0,
      new_cards_studied INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function getDb(): Database.Database {
  if (!global.__fukubunDb) {
    global.__fukubunDb = createConnection();
  }
  return global.__fukubunDb;
}

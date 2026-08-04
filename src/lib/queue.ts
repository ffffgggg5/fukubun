import { getDb } from "./db";
import { addDays, today } from "./date";
import { NEW_CARDS_PER_DAY, nextDueDate, nextIntervalDays } from "./srs";
import type { HistoryEntry, QueueItem, QueueStats } from "./types";

interface ReviewStateRow {
  id: number;
  card_type: "sentence" | "memo";
  card_id: number;
  interval_days: number;
  due_date: string;
  is_new: number;
  queued_date: string | null;
}

function getDailyProgress(date: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT date, completed, new_cards_studied FROM daily_progress WHERE date = ?`)
    .get(date) as { date: string; completed: number; new_cards_studied: number } | undefined;
  if (row) return row;
  db.prepare(
    `INSERT INTO daily_progress (date, completed, new_cards_studied) VALUES (?, 0, 0)`
  ).run(date);
  return { date, completed: 0, new_cards_studied: 0 };
}

/** Assigns today's date to a random batch of not-yet-queued new cards, up to the daily cap. */
function ensureTodaysNewCardBatch() {
  const db = getDb();
  const date = today();
  const progress = getDailyProgress(date);
  const remainingSlots = NEW_CARDS_PER_DAY - progress.new_cards_studied;

  const alreadyQueuedToday = db
    .prepare(
      `SELECT COUNT(*) as count FROM review_state WHERE is_new = 1 AND queued_date = ?`
    )
    .get(date) as { count: number };

  const slotsToFill = remainingSlots - alreadyQueuedToday.count;
  if (slotsToFill <= 0) return;

  const candidates = db
    .prepare(
      `SELECT id FROM review_state WHERE is_new = 1 AND queued_date IS NULL ORDER BY RANDOM() LIMIT ?`
    )
    .all(slotsToFill) as { id: number }[];

  const markQueued = db.prepare(`UPDATE review_state SET queued_date = ? WHERE id = ?`);
  const run = db.transaction(() => {
    for (const c of candidates) {
      markQueued.run(date, c.id);
    }
  });
  run();
}

function fetchQueueRows(): ReviewStateRow[] {
  const db = getDb();
  const date = today();
  ensureTodaysNewCardBatch();

  const dueRows = db
    .prepare(
      `SELECT * FROM review_state WHERE is_new = 0 AND due_date <= ? ORDER BY due_date ASC`
    )
    .all(date) as ReviewStateRow[];

  const newRows = db
    .prepare(`SELECT * FROM review_state WHERE is_new = 1 AND queued_date = ? ORDER BY RANDOM()`)
    .all(date) as ReviewStateRow[];

  return [...dueRows, ...newRows];
}

export function getTodayQueue(): QueueItem[] {
  const db = getDb();
  const rows = fetchQueueRows();

  const items: QueueItem[] = rows.map((row) => {
    if (row.card_type === "sentence") {
      const card = db
        .prepare(`SELECT english, japanese FROM sentence_cards WHERE id = ?`)
        .get(row.card_id) as { english: string; japanese: string };
      return {
        cardType: "sentence",
        cardId: row.card_id,
        isNew: row.is_new === 1,
        english: card.english,
        japanese: card.japanese,
      };
    }
    const card = db
      .prepare(`SELECT front, back FROM memo_cards WHERE id = ?`)
      .get(row.card_id) as { front: string; back: string };
    return {
      cardType: "memo",
      cardId: row.card_id,
      isNew: row.is_new === 1,
      front: card.front,
      back: card.back,
    };
  });

  return items;
}

export function getQueueStats(): QueueStats {
  const rows = fetchQueueRows();
  const dueCount = rows.filter((r) => r.is_new === 0).length;
  const newRemainingCount = rows.filter((r) => r.is_new === 1).length;
  const progress = getDailyProgress(today());
  return {
    dueCount,
    newRemainingCount,
    totalRemaining: dueCount + newRemainingCount,
    completedToday: progress.completed === 1,
  };
}

function finalizeReview(cardType: "sentence" | "memo", cardId: number, correct: boolean) {
  const db = getDb();
  const date = today();
  const state = db
    .prepare(`SELECT * FROM review_state WHERE card_type = ? AND card_id = ?`)
    .get(cardType, cardId) as ReviewStateRow;

  const wasNew = state.is_new === 1;
  const intervalDays = nextIntervalDays(state.interval_days, correct);
  const dueDate = nextDueDate(intervalDays);

  db.prepare(
    `UPDATE review_state
     SET interval_days = ?, due_date = ?, last_reviewed_at = datetime('now'), is_new = 0
     WHERE id = ?`
  ).run(intervalDays, dueDate, state.id);

  getDailyProgress(date);
  if (wasNew) {
    db.prepare(
      `UPDATE daily_progress SET new_cards_studied = new_cards_studied + 1 WHERE date = ?`
    ).run(date);
  }

  const stats = getQueueStats();
  if (stats.totalRemaining === 0) {
    db.prepare(`UPDATE daily_progress SET completed = 1 WHERE date = ?`).run(date);
  }
}

export function submitSentenceReview(
  cardId: number,
  en2ja: { answer: string; correct: boolean },
  ja2en: { answer: string; correct: boolean }
) {
  const db = getDb();
  const insertLog = db.prepare(
    `INSERT INTO review_log (card_type, card_id, phase, user_answer, is_correct)
     VALUES ('sentence', ?, ?, ?, ?)`
  );
  const run = db.transaction(() => {
    insertLog.run(cardId, "en2ja", en2ja.answer, en2ja.correct ? 1 : 0);
    insertLog.run(cardId, "ja2en", ja2en.answer, ja2en.correct ? 1 : 0);
    finalizeReview("sentence", cardId, en2ja.correct && ja2en.correct);
  });
  run();
}

export function submitMemoReview(cardId: number, answer: string, correct: boolean) {
  const db = getDb();
  const insertLog = db.prepare(
    `INSERT INTO review_log (card_type, card_id, phase, user_answer, is_correct)
     VALUES ('memo', ?, 'memo', ?, ?)`
  );
  const run = db.transaction(() => {
    insertLog.run(cardId, answer, correct ? 1 : 0);
    finalizeReview("memo", cardId, correct);
  });
  run();
}

export function getCardHistory(cardType: "sentence" | "memo", cardId: number): HistoryEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT phase, user_answer, is_correct, reviewed_at FROM review_log
       WHERE card_type = ? AND card_id = ? ORDER BY reviewed_at DESC LIMIT 20`
    )
    .all(cardType, cardId) as {
    phase: "en2ja" | "ja2en" | "memo";
    user_answer: string;
    is_correct: number;
    reviewed_at: string;
  }[];
  return rows.map((r) => ({
    phase: r.phase,
    userAnswer: r.user_answer,
    isCorrect: r.is_correct === 1,
    reviewedAt: r.reviewed_at,
  }));
}

export function getStreak(): number {
  const db = getDb();
  const rows = db
    .prepare(`SELECT date, completed FROM daily_progress ORDER BY date DESC`)
    .all() as { date: string; completed: number }[];

  const completedDates = new Set(rows.filter((r) => r.completed === 1).map((r) => r.date));

  let streak = 0;
  let cursor = today();
  // Today doesn't need to be complete yet for the streak to still be "alive".
  if (!completedDates.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

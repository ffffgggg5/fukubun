import { getDb } from "./db";
import { today } from "./date";

export function createSentenceCard(english: string, japanese: string): number {
  const db = getDb();
  const insertCard = db.prepare(
    `INSERT INTO sentence_cards (english, japanese) VALUES (?, ?)`
  );
  const insertState = db.prepare(
    `INSERT INTO review_state (card_type, card_id, interval_days, due_date, is_new)
     VALUES ('sentence', ?, 0, ?, 1)`
  );
  const run = db.transaction((en: string, ja: string) => {
    const info = insertCard.run(en, ja);
    const cardId = Number(info.lastInsertRowid);
    insertState.run(cardId, today());
    return cardId;
  });
  return run(english, japanese);
}

export function createMemoCard(front: string, back: string): number {
  const db = getDb();
  const insertCard = db.prepare(
    `INSERT INTO memo_cards (front, back) VALUES (?, ?)`
  );
  const insertState = db.prepare(
    `INSERT INTO review_state (card_type, card_id, interval_days, due_date, is_new)
     VALUES ('memo', ?, 0, ?, 1)`
  );
  const run = db.transaction((front: string, back: string) => {
    const info = insertCard.run(front, back);
    const cardId = Number(info.lastInsertRowid);
    insertState.run(cardId, today());
    return cardId;
  });
  return run(front, back);
}

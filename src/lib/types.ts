export type CardType = "sentence" | "memo";

export interface SentenceQueueItem {
  cardType: "sentence";
  cardId: number;
  isNew: boolean;
  english: string;
  japanese: string;
}

export interface MemoQueueItem {
  cardType: "memo";
  cardId: number;
  isNew: boolean;
  front: string;
  back: string;
}

export type QueueItem = SentenceQueueItem | MemoQueueItem;

export interface QueueStats {
  dueCount: number;
  newRemainingCount: number;
  totalRemaining: number;
  completedToday: boolean;
}

export interface HistoryEntry {
  phase: "en2ja" | "ja2en" | "memo";
  userAnswer: string;
  isCorrect: boolean;
  reviewedAt: string;
}

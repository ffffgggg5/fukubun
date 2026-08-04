"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HistoryEntry, QueueItem } from "@/lib/types";

type SentencePhase = "en2ja" | "ja2en";

interface PhaseResult {
  answer: string;
  correct: boolean;
}

export default function StudyPage() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<SentencePhase>("en2ja");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [en2jaResult, setEn2jaResult] = useState<PhaseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/queue")
      .then((res) => res.json())
      .then((data) => setItems(data.items));
  }, []);

  function resetForNextCard() {
    setPhase("en2ja");
    setTypedAnswer("");
    setRevealed(false);
    setHistory([]);
    setEn2jaResult(null);
  }

  async function handleReveal(cardType: "sentence" | "memo", cardId: number, historyPhase: string) {
    setRevealed(true);
    const res = await fetch(`/api/history?cardType=${cardType}&cardId=${cardId}`);
    const data = await res.json();
    const allHistory = (data.history ?? []) as HistoryEntry[];
    setHistory(allHistory.filter((h) => h.phase === historyPhase));
  }

  async function handleSentenceJudge(current: Extract<QueueItem, { cardType: "sentence" }>, correct: boolean) {
    if (phase === "en2ja") {
      setEn2jaResult({ answer: typedAnswer, correct });
      setPhase("ja2en");
      setTypedAnswer("");
      setRevealed(false);
      setHistory([]);
      return;
    }

    if (!en2jaResult) return;
    setSubmitting(true);
    await fetch("/api/review/sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: current.cardId,
        en2ja: en2jaResult,
        ja2en: { answer: typedAnswer, correct },
      }),
    });
    goToNext();
  }

  async function handleMemoJudge(current: Extract<QueueItem, { cardType: "memo" }>, correct: boolean) {
    setSubmitting(true);
    await fetch("/api/review/memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: current.cardId, answer: typedAnswer, correct }),
    });
    goToNext();
  }

  function goToNext() {
    setSubmitting(false);
    setIndex((i) => i + 1);
    resetForNextCard();
  }

  if (items === null) {
    return <CenteredMessage>読み込み中...</CenteredMessage>;
  }

  if (index >= items.length) {
    return (
      <CenteredMessage>
        <p className="text-xl font-medium">お疲れ様でした 🎉</p>
        <Link href="/" className="text-sm text-neutral-500 underline">
          ホームに戻る
        </Link>
      </CenteredMessage>
    );
  }

  const current = items[index];
  const remaining = items.length - index;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <Link href="/" className="underline">
          ← 中断してホームへ
        </Link>
        <span>残り {remaining} 問</span>
      </div>

      {current.cardType === "sentence" ? (
        <SentenceCard
          key={`${current.cardId}-${phase}`}
          item={current}
          phase={phase}
          typedAnswer={typedAnswer}
          onChangeAnswer={setTypedAnswer}
          revealed={revealed}
          history={history}
          onReveal={() =>
            handleReveal("sentence", current.cardId, phase)
          }
          onJudge={(correct) => handleSentenceJudge(current, correct)}
          submitting={submitting}
        />
      ) : (
        <MemoCard
          key={current.cardId}
          item={current}
          typedAnswer={typedAnswer}
          onChangeAnswer={setTypedAnswer}
          revealed={revealed}
          history={history}
          onReveal={() => handleReveal("memo", current.cardId, "memo")}
          onJudge={(correct) => handleMemoJudge(current, correct)}
          submitting={submitting}
        />
      )}
    </main>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </main>
  );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">
      <p className="font-medium text-neutral-500">過去の回答</p>
      <ul className="flex flex-col gap-1">
        {history.map((h, i) => (
          <li key={i} className="flex items-start gap-2">
            <span>{h.isCorrect ? "⭕️" : "❌️"}</span>
            <span className="text-neutral-600 dark:text-neutral-400">{h.userAnswer}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JudgeButtons({ onJudge, disabled }: { onJudge: (correct: boolean) => void; disabled: boolean }) {
  return (
    <div className="flex gap-3">
      <button
        disabled={disabled}
        onClick={() => onJudge(true)}
        className="flex-1 rounded-lg border border-green-500 py-3 text-lg text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-950"
      >
        ⭕️
      </button>
      <button
        disabled={disabled}
        onClick={() => onJudge(false)}
        className="flex-1 rounded-lg border border-red-500 py-3 text-lg text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
      >
        ❌️
      </button>
    </div>
  );
}

function SentenceCard({
  item,
  phase,
  typedAnswer,
  onChangeAnswer,
  revealed,
  history,
  onReveal,
  onJudge,
  submitting,
}: {
  item: Extract<QueueItem, { cardType: "sentence" }>;
  phase: SentencePhase;
  typedAnswer: string;
  onChangeAnswer: (v: string) => void;
  revealed: boolean;
  history: HistoryEntry[];
  onReveal: () => void;
  onJudge: (correct: boolean) => void;
  submitting: boolean;
}) {
  const prompt = phase === "en2ja" ? item.english : item.japanese;
  const answerText = phase === "en2ja" ? item.japanese : item.english;
  const label = phase === "en2ja" ? "日本語訳を入力" : "英訳を入力（復元）";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <p className="text-xs text-neutral-500">
          {phase === "en2ja" ? "STEP 1: 和訳" : "STEP 2: 英訳復元"}
        </p>
        <p className="mt-2 text-lg">{prompt}</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <textarea
          value={typedAnswer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          className="min-h-24 rounded-lg border border-neutral-300 p-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {!revealed ? (
        <button
          onClick={onReveal}
          className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          答え
        </button>
      ) : (
        <>
          <div className="rounded-xl bg-neutral-100 p-5 dark:bg-neutral-900">
            <p className="text-xs text-neutral-500">正解</p>
            <p className="mt-2 text-lg">{answerText}</p>
          </div>
          <HistoryList history={history} />
          <JudgeButtons onJudge={onJudge} disabled={submitting} />
        </>
      )}
    </div>
  );
}

function MemoCard({
  item,
  typedAnswer,
  onChangeAnswer,
  revealed,
  history,
  onReveal,
  onJudge,
  submitting,
}: {
  item: Extract<QueueItem, { cardType: "memo" }>;
  typedAnswer: string;
  onChangeAnswer: (v: string) => void;
  revealed: boolean;
  history: HistoryEntry[];
  onReveal: () => void;
  onJudge: (correct: boolean) => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <p className="text-xs text-neutral-500">メモ</p>
        <p className="mt-2 text-lg">{item.front}</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">思い出したことをメモ（任意）</span>
        <textarea
          value={typedAnswer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          className="min-h-16 rounded-lg border border-neutral-300 p-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {!revealed ? (
        <button
          onClick={onReveal}
          className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          答え
        </button>
      ) : (
        <>
          <div className="rounded-xl bg-neutral-100 p-5 dark:bg-neutral-900">
            <p className="text-xs text-neutral-500">答え</p>
            <p className="mt-2 text-lg">{item.back}</p>
          </div>
          <HistoryList history={history} />
          <JudgeButtons onJudge={onJudge} disabled={submitting} />
        </>
      )}
    </div>
  );
}

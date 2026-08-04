"use client";

import Link from "next/link";
import { useState } from "react";

export default function MemoPage() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setStatus("saving");
    await fetch("/api/memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front, back }),
    });
    setFront("");
    setBack("");
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 underline">
        ← ホームに戻る
      </Link>
      <h1 className="text-2xl font-bold">メモを追加</h1>
      <p className="text-sm text-neutral-500">
        気づいたことを一問一答のカードとして登録すると、英文の問題と同じ復習サイクルに乗ります。
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">表（問い）</span>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="min-h-24 rounded-lg border border-neutral-300 p-3 dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="例: 「〜するつもりだ」の英語表現は？"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">裏（答え・気づき）</span>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="min-h-24 rounded-lg border border-neutral-300 p-3 dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="例: be going to / intend to は意志のニュアンスが強い"
          />
        </label>
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-neutral-900 px-6 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {status === "saved" ? "登録しました ✓" : "登録する"}
        </button>
      </form>
    </main>
  );
}

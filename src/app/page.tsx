import Link from "next/link";
import { getQueueStats, getStreak } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default function Home() {
  const stats = getQueueStats();
  const streak = getStreak();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm text-neutral-500">連続学習日数</p>
        <p className="text-6xl font-bold tabular-nums">
          {streak}
          <span className="ml-2 text-2xl font-normal text-neutral-500">日</span>
        </p>
      </div>

      <div className="w-full rounded-xl border border-neutral-200 p-6 text-center dark:border-neutral-800">
        {stats.totalRemaining === 0 ? (
          <p className="text-lg font-medium">
            {stats.completedToday ? "今日の分は完了しました 🎉" : "今日の問題はありません"}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-lg font-medium">今日やること</p>
            <p className="text-sm text-neutral-500">
              復習 {stats.dueCount} 件 / 新規 {stats.newRemainingCount} 件
            </p>
          </div>
        )}
      </div>

      <Link
        href="/study"
        className="w-full rounded-lg bg-neutral-900 px-6 py-3 text-center font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {stats.totalRemaining === 0 ? "問題を見直す" : "学習を始める"}
      </Link>

      <Link href="/memo" className="text-sm text-neutral-500 underline">
        メモを追加する
      </Link>
    </main>
  );
}

import { NextResponse } from "next/server";
import { getQueueStats, getTodayQueue } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET() {
  const items = getTodayQueue();
  const stats = getQueueStats();
  return NextResponse.json({ items, stats });
}

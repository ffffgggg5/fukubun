import { NextResponse } from "next/server";
import { getStreak } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ streak: getStreak() });
}

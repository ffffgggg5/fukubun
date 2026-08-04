import { NextResponse } from "next/server";
import { createMemoCard } from "@/lib/cards";

export const runtime = "nodejs";

interface Body {
  front: string;
  back: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Body>;

  if (typeof body.front !== "string" || typeof body.back !== "string" || !body.front.trim() || !body.back.trim()) {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const cardId = createMemoCard(body.front.trim(), body.back.trim());
  return NextResponse.json({ ok: true, cardId });
}

import { NextResponse } from "next/server";
import { submitMemoReview } from "@/lib/queue";

export const runtime = "nodejs";

interface Body {
  cardId: number;
  answer: string;
  correct: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Body>;

  if (
    typeof body.cardId !== "number" ||
    typeof body.answer !== "string" ||
    typeof body.correct !== "boolean"
  ) {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  submitMemoReview(body.cardId, body.answer, body.correct);
  return NextResponse.json({ ok: true });
}

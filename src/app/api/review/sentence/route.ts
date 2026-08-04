import { NextResponse } from "next/server";
import { submitSentenceReview } from "@/lib/queue";

export const runtime = "nodejs";

interface Phase {
  answer: string;
  correct: boolean;
}

interface Body {
  cardId: number;
  en2ja: Phase;
  ja2en: Phase;
}

function isPhase(value: unknown): value is Phase {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.answer === "string" && typeof v.correct === "boolean";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Body>;

  if (
    typeof body.cardId !== "number" ||
    !isPhase(body.en2ja) ||
    !isPhase(body.ja2en)
  ) {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  submitSentenceReview(body.cardId, body.en2ja, body.ja2en);
  return NextResponse.json({ ok: true });
}

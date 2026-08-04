import { NextResponse } from "next/server";
import { getCardHistory } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardType = searchParams.get("cardType");
  const cardIdParam = searchParams.get("cardId");
  const cardId = cardIdParam ? Number(cardIdParam) : NaN;

  if ((cardType !== "sentence" && cardType !== "memo") || Number.isNaN(cardId)) {
    return NextResponse.json({ error: "invalid query params" }, { status: 400 });
  }

  const history = getCardHistory(cardType, cardId);
  return NextResponse.json({ history });
}

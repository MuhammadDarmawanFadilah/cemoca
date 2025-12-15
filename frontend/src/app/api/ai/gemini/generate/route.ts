import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Moved to backend. Use /api/ai/gemini/generate on Spring Boot." },
    { status: 410 }
  );
}

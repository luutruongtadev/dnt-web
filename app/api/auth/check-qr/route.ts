import { NextRequest } from "next/server";
import { pollQrSession } from "@/lib/auth/qr-poll";

// Faithful port of auth.js:checkQrStatus — POST /auth/check-qr (sessionId from body or query).
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) ?? {};
  const sessionId = body.sessionId || req.nextUrl.searchParams.get("sessionId");
  return pollQrSession(sessionId);
}

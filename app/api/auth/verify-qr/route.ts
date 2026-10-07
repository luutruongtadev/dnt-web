import { NextResponse } from "next/server";
import { bearer, userFromBearer } from "@/lib/auth";
import { qrCodeStore } from "@/lib/auth/qr-store";

// Faithful port of auth.js:verifyQR — POST /auth/verify-qr (mobile authenticates).
export async function POST(req: Request) {
  const { sessionId } = (await req.json().catch(() => ({}))) ?? {};
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

  const session = qrCodeStore.get(sessionId);
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
  if (Date.now() > session.expiresAt) {
    qrCodeStore.delete(sessionId);
    return NextResponse.json({ error: "Session expired" }, { status: 400 });
  }
  if (session.status !== "pending") return NextResponse.json({ error: "Session already used" }, { status: 400 });

  qrCodeStore.set(sessionId, { ...session, status: "authenticated", token, user });
  return NextResponse.json({ success: true, message: "Authentication successful", token, user });
}

import { NextResponse } from "next/server";
import { qrCodeStore } from "@/lib/auth/qr-store";

// Shared polling logic for qr-login / check-qr (auth.js:qrLogin & checkQrStatus).
export function pollQrSession(sessionId: string | null | undefined) {
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  const session = qrCodeStore.get(sessionId);
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
  if (Date.now() > session.expiresAt) {
    qrCodeStore.delete(sessionId);
    return NextResponse.json({ error: "Session expired" }, { status: 400 });
  }
  if (session.status === "pending") {
    return NextResponse.json({ status: "pending", message: "Waiting for mobile authentication" });
  }
  if (session.status === "authenticated") {
    qrCodeStore.delete(sessionId);
    return NextResponse.json({ status: "authenticated", token: session.token, user: session.user });
  }
  return NextResponse.json({ error: "Invalid session status" }, { status: 400 });
}

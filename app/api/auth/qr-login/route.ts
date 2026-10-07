import { pollQrSession } from "@/lib/auth/qr-poll";

// Faithful port of auth.js:qrLogin — POST /auth/qr-login (web client polls).
export async function POST(req: Request) {
  const { sessionId } = (await req.json().catch(() => ({}))) ?? {};
  return pollQrSession(sessionId);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer, bearer } from "@/lib/auth";

// Faithful port of auth.js:toggleSessionStatus — POST /auth/sessions/toggle-status.
export async function POST(req: Request) {
  if (!bearer(req)) return NextResponse.json({ error: "No token provided" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { session_id, otp } = (await req.json().catch(() => ({}))) ?? {};
  if (!session_id || !otp) return NextResponse.json({ error: "session_id and otp are required" }, { status: 400 });
  if (String(user.otp) !== String(otp)) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

  const session = await prisma.user_sessions.findFirst({ where: { id: Number(session_id), user_id: user.id } });
  if (!session) return NextResponse.json({ error: "Session not found or does not belong to you" }, { status: 404 });

  const newStatus = session.status === "login" ? "logout" : "login";
  await prisma.user_sessions.update({ where: { id: session.id }, data: { status: newStatus, updated_at: new Date() } });
  return NextResponse.json({ success: true, message: `Session status changed to ${newStatus}`, session_id, new_status: newStatus });
}

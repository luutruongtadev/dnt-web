import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Faithful port of recovery.js:verifyRecoveryAccount — POST /auth/recovery/verify-account.
export async function POST(req: Request) {
  const { accountId } = (await req.json().catch(() => ({}))) ?? {};
  if (!accountId) return NextResponse.json({ error: "accountId is required" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { bank_number: accountId } });
  if (!user) return NextResponse.json({ success: false, error: "INVALID_ACCOUNT" }, { status: 400 });

  if (user.blocked) return NextResponse.json({ success: false, error: "PERMANENTLY_BLOCKED" }, { status: 403 });
  if (user.temp_blocked_until && new Date(user.temp_blocked_until) > new Date()) {
    return NextResponse.json({ success: false, error: "TEMP_BLOCKED" }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
